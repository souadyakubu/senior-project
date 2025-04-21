const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API credentials
const API_KEY = 'senior-project-2025';
const API_USER_ID = '4';

app.get('/api/fetch-content', async (req, res) => {
    try {
        let url = req.query.url;
        console.log('Original URL requested:', url);
        
        // Fix Bible passage URLs - prevent duplicate file paths
        if (url.includes('/ccel/bible/') && url.includes('.html')) {
            // Extract the main parts to construct a proper URL
            const parts = url.split('/');
            const bibleIndex = parts.indexOf('bible');
            
            if (bibleIndex !== -1 && bibleIndex + 1 < parts.length) {
                // Get the Bible reference (e.g., "NRSV.1John.4.html")
                const bibleRef = parts[bibleIndex + 1].split('.html')[0] + '.html';
                
                // Construct a clean URL without duplication
                url = `https://www.ccel.org/ccel/bible/${bibleRef}`;
                console.log('Fixed Bible URL:', url);
            }
        }
        
        console.log('Attempting to fetch:', url);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Remove unwanted elements
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('header').remove();
        $('footer').remove();
        $('.navbar').remove();
        $('.menu').remove();
        $('.sidebar').remove();
        $('.advertisement').remove();
        $('[class*="ads"]').remove();
        $('.book_navbar').remove();
        $('.selection-popup').remove();

        // For table of contents (XML)
        if (url.includes('toc.xml')) {
            const mainContent = $('div').html();
            if (!mainContent) {
                return res.status(404).json({ 
                    error: 'TOC content not found',
                    url: url 
                });
            }
            return res.json({ content: mainContent });
        }

        // For book pages
        let mainContent = $('.book-content').html() || 
                       $('#theText').html() || 
                       $('.content').html() ||
                       $('#content').html();

        if (!mainContent) {
            return res.status(404).json({ 
                error: 'Content not found',
                url: url 
            });
        }

        // Clean up the content
        mainContent = mainContent
            .replace(/\n\s+/g, '\n')  // Remove excess whitespace
            .replace(/<span class="pb".*?<\/span>/g, '') // Remove page breaks
            .replace(/href="\//g, `href="https://ccel.org/`) // Fix relative URLs
            .replace(/src="\//g, `src="https://ccel.org/`); // Fix relative image URLs

        res.json({ 
            content: mainContent,
            status: 'success',
            url: url
        });

    } catch (error) {
        console.error('Proxy error:', error);
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({ 
            error: 'Failed to fetch content', 
            details: error.message,
            url: req.query.url
        });
    }
});

// Updated endpoint to use the CCEL search API
app.get('/api/search-ccel', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
      
        console.log('Searching CCEL for:', query);
        
        // First try the official API
        try {
            // Use the official CCEL search API
            const searchUrl = `https://search.ccel.org/api/search/results/${encodeURIComponent(query)}?api_key=${API_KEY}&api_user_id=${API_USER_ID}&uid=1`;
          
            console.log('Using search URL:', searchUrl);
          
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 15000 // Increased timeout
            });
          
            // Log the first part of the response to understand structure
            console.log('API response status:', response.status);
            console.log('API response data preview:', 
                JSON.stringify(response.data).substring(0, 300) + '...');
          
            // Process and format the results from the API
            const apiResults = response.data.results || [];
            
            // Log a sample result to debug
            if (apiResults.length > 0) {
                console.log('Sample result from API:', apiResults[0]);
            }
            
            const formattedResults = apiResults.map(book => {
                // Extract a clean title
                let title = 'Unknown Title';
                
                // Known workID to title mappings
                const knownTitles = {
                    'institutes': "Institutes of the Christian Religion",
                    'encycl3a': "Early Church Fathers - Ante-Nicene Fathers",
                    'hcc3': "History of the Christian Church, Volume 3",
                    'person': "Dictionary of Christian Biography and Literature",
                    'decline': "History of the Decline and Fall of the Roman Empire",
                    'practice': "The Practice of the Presence of God",
                    'imitation': "The Imitation of Christ",
                    'augustine-confessions': "Confessions of St. Augustine",
                    'bunyan-pilgrim': "The Pilgrim's Progress",
                    'aquinas-summa': "Summa Theologica",
                    'foxe-martyrs': "Foxe's Book of Martyrs",
                    'wesley-sermons': "Wesley's Sermons",
                    'schaff': "History of the Christian Church"
                };
                
                // First check if we have a known title for this workID
                if (book.workID && knownTitles[book.workID]) {
                    title = knownTitles[book.workID];
                }
                // If not in our known list, try to get a clean title from workID
                else if (book.workID) {
                    // Format workID into a readable title
                    if (book.workID.match(/^[a-z0-9_]+$/i)) {
                        // If it looks like an abbreviation/code (all lowercase with numbers)
                        // Format it better
                        if (book.authorID) {
                            const authorName = book.authorID.charAt(0).toUpperCase() + book.authorID.slice(1);
                            title = `${authorName}'s ${book.workID.toUpperCase().replace(/_/g, ' ')}`;
                        } else {
                            title = book.workID.toUpperCase().replace(/_/g, ' ');
                        }
                    } else {
                        // Regular formatting
                        title = book.workID.charAt(0).toUpperCase() + 
                                book.workID.slice(1).replace(/_/g, ' ');
                    }
                    
                    // Add specific descriptions based on patterns
                    if (book.workID.toLowerCase().includes('calcom')) {
                        // Handle Calvin's Commentaries format
                        if (book.snippets && (book.snippets.descriptor || book.snippets.text)) {
                            const rawText = (book.snippets.descriptor || book.snippets.text)
                                .replace(/__/g, '') // Remove underscores around terms
                                .replace(/_/g, '');  // Remove single underscores
                            
                            // Try to extract commentary subject
                            if (rawText.toLowerCase().includes('commentary on')) {
                                const match = rawText.match(/commentary on\s+([^.,;:]+)/i);
                                if (match && match[1]) {
                                    title = `Commentary on ${match[1].trim()}`;
                                }
                            } else if (rawText.toLowerCase().includes('commentaries')) {
                                title = "Calvin's Commentaries";
                            }
                        }
                    }
                }
                // If we still don't have a good title, try to extract from snippets
                else if (book.snippets && (book.snippets.descriptor || book.snippets.text)) {
                    const rawText = (book.snippets.descriptor || book.snippets.text)
                        .replace(/__/g, '') // Remove underscores around terms
                        .replace(/_/g, '')  // Remove single underscores
                        .trim();
                    
                    // Look for a clear title pattern first
                    let titleMatch = null;
                    
                    // For commentaries, get "Commentary on X"
                    if (rawText.toLowerCase().includes('commentary on')) {
                        titleMatch = rawText.match(/commentary on\s+([^.,;:]+)/i);
                        if (titleMatch && titleMatch[1]) {
                            title = `Commentary on ${titleMatch[1].trim()}`;
                        }
                    }
                    // For books with clear quotes or titles
                    else if (rawText.includes('"') && rawText.indexOf('"') < 30) {
                        titleMatch = rawText.match(/"([^"]+)"/);
                        if (titleMatch && titleMatch[1]) {
                            title = titleMatch[1].trim();
                        }
                    }
                    // If no clear pattern, extract the first sentence or phrase
                    else {
                        // Try to get the first sentence or phrase
                        titleMatch = rawText.match(/^[^.,:;!?-]+/);
                        if (titleMatch) {
                            title = titleMatch[0].trim();
                            // If still too long, cap it
                            if (title.length > 50) {
                                title = title.substring(0, 47) + '...';
                            }
                        } else {
                            // If we can't match a clean phrase, use a limited portion
                            title = rawText.length > 50 ? rawText.substring(0, 47) + '...' : rawText;
                        }
                    }
                }
                
                // Extract author (capitalize first letter)
                const author = book.authorID ? 
                    book.authorID.charAt(0).toUpperCase() + book.authorID.slice(1) : 
                    'Unknown Author';
                
                // Get work name from workID
                const workName = book.workID || '';
                
                // Use external_url for the link
                const link = book.external_url || '';
                
                // Extract baseUrl and urlName from external_url
                let baseUrl = '';
                let urlName = '';
                
                try {
                    if (link) {
                        const urlParts = link.split('/');
                        const ccelIndex = urlParts.indexOf('ccel');
                        
                        if (ccelIndex >= 0 && ccelIndex + 2 < urlParts.length) {
                            urlName = urlParts[ccelIndex + 2];
                            baseUrl = urlParts.slice(0, ccelIndex + 3).join('/');
                        }
                    }
                } catch (e) {
                    console.error('Error parsing URL:', e);
                }

                // Create summary from workID and versionID if available
                let summary = '';
                if (workName) {
                    summary = `${workName}`;
                    if (book.versionID && book.versionID !== workName) {
                        summary += ` (${book.versionID})`;
                    }
                }
                
                // Special handling for Bible passages
                let specialType = '';
                if (book.authorID === 'bible') {
                    specialType = 'bible';
                }
                
                // For works with no discernible title, create a descriptive one
                if (title === 'Unknown Title' && author !== 'Unknown Author') {
                    title = `Work by ${author}`;
                    if (workName) {
                        title += `: ${workName}`;
                    }
                }
                
                const result = {
                    id: book.id || `${author.toLowerCase()}-${urlName || workName || 'unknown'}`,
                    title: title,
                    author: author,
                    baseUrl: baseUrl || '',
                    urlName: urlName || workName || '',
                    link: link,
                    cover: '/placeholder-cover.jpg',
                    summary: summary,
                    type: specialType
                };
                
                // Log the formatted result
                console.log(`Formatted result for book ${result.id}:`, result);
                
                return result;
            });
          
            console.log(`API returned ${formattedResults.length} results for query "${query}"`);
            return res.json({ results: formattedResults });
            
        } catch (apiError) {
            console.error('Error with API search, falling back to scraping:', apiError);
            
            // If API fails, fall back to scraping (original implementation)
            console.log('Falling back to scraping search...');
            
            // Format the query for CCEL's search URL
            const formattedQuery = encodeURIComponent(query);
            const searchUrl = `https://ccel.org/search?qu=${formattedQuery}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: 10000
            });
        
            const $ = cheerio.load(response.data);
            
            // Try to find search results with multiple possible selectors
            const results = [];
            
            // Log the structure to help diagnose
            console.log('Page title:', $('title').text());
            console.log('Page has search results container:', $('.search-results, #search-results, .results-container').length > 0);
            
            // Try different selectors that might contain search results
            $('.work-listing, .browse-work, article, .book-item, .search-item, .result-item').each((index, element) => {
                const el = $(element);
                
                // Extract title - try different possible selectors
                let title = el.find('.title, h2, h3, h4').first().text().trim();
                if (!title) {
                    title = el.find('a[href*="/ccel/"]').first().text().trim();
                }
                
                // Clean up title if it's too long
                if (title && title.length > 50) {
                    // Look for natural breakpoints
                    const match = title.match(/^[^.,:;!?-]+/);
                    if (match) {
                        title = match[0].trim();
                    } else {
                        title = title.substring(0, 47) + '...';
                    }
                }
                
                // Extract URL
                let url = '';
                const linkElement = el.find('a[href*="/ccel/"]').first();
                if (linkElement.length) {
                    url = linkElement.attr('href');
                    // Make URL absolute if it's relative
                    if (url && !url.startsWith('http')) {
                        url = `https://ccel.org${url.startsWith('/') ? '' : '/'}${url}`;
                    }
                }
                
                // Extract author
                let author = el.find('.author, [itemprop="author"]').text().trim();
                if (!author) {
                    // Look for text containing "by" and extract the author
                    el.find('p, div, span').each((i, elem) => {
                        const text = $(elem).text();
                        if (text.includes('by ')) {
                            author = text.split('by ')[1].trim();
                            return false; // Break the loop
                        }
                    });
                }
                
                if (title) {
                    console.log(`Found result: "${title}" by ${author || 'Unknown'} at ${url}`);
                    
                    // Extract baseUrl and urlName from the URL
                    let baseUrl = '';
                    let urlName = '';
                    
                    try {
                        if (url) {
                            // Example URL: https://ccel.org/ccel/calvin/institutes/institutes.i.html
                            // We want baseUrl: https://ccel.org/ccel/calvin/institutes
                            // and urlName: institutes
                            const urlParts = url.split('/');
                            const ccelIndex = urlParts.indexOf('ccel');
                            
                            if (ccelIndex >= 0 && ccelIndex + 2 < urlParts.length) {
                                urlName = urlParts[ccelIndex + 2];
                                baseUrl = urlParts.slice(0, ccelIndex + 3).join('/');
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing URL:', e);
                    }
                    
                    // Create a unique ID if none exists
                    const bookId = `${author || 'unknown'}-${urlName || title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                    
                    results.push({
                        id: bookId,
                        title: title || 'Unknown Title',
                        author: author || 'Unknown Author',
                        baseUrl: baseUrl || (url ? url.substring(0, url.lastIndexOf('/')) : ''),
                        urlName: urlName || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        link: url || '',
                        cover: '/placeholder-cover.jpg',
                        summary: ''
                    });
                }
            });
            
            console.log(`Found ${results.length} results for query "${query}"`);
            
            // If no results found using our selectors, try a different approach
            if (results.length === 0) {
                console.log('No results found with primary selectors, trying alternative selectors...');
                
                // Look for any links to /ccel/ paths which might be search results
                $('a[href*="/ccel/"]').each((index, element) => {
                    const el = $(element);
                    const url = el.attr('href');
                    let title = el.text().trim();
                    
                    // Skip navigation links and other non-result links
                    if (!title || title.length < 5 || title.includes('Home') || title.includes('Menu')) {
                        return;
                    }
                    
                    // Clean up title if it's too long
                    if (title.length > 50) {
                        // Try to extract a sensible title
                        const match = title.match(/^[^.,:;!?-]+/);
                        if (match) {
                            title = match[0].trim();
                        } else {
                            title = title.substring(0, 47) + '...';
                        }
                    }
                    
                    console.log(`Found potential result link: "${title}" at ${url}`);
                    
                    // Try to find author near this link
                    let author = 'Unknown';
                    const parentEl = el.parent();
                    const parentText = parentEl.text();
                    if (parentText.includes('by ')) {
                        author = parentText.split('by ')[1].trim();
                    }
                    
                    // Extract baseUrl and urlName from the URL
                    let baseUrl = '';
                    let urlName = '';
                    
                    try {
                        const fullUrl = url.startsWith('http') ? url : `https://ccel.org${url.startsWith('/') ? '' : '/'}${url}`;
                        const urlParts = fullUrl.split('/');
                        const ccelIndex = urlParts.indexOf('ccel');
                        
                        if (ccelIndex >= 0 && ccelIndex + 2 < urlParts.length) {
                            urlName = urlParts[ccelIndex + 2];
                            baseUrl = urlParts.slice(0, ccelIndex + 3).join('/');
                        }
                    } catch (e) {
                        console.error('Error parsing URL:', e);
                    }
                    
                    // Only add if we don't already have this result
                    if (!results.some(r => r.link === url)) {
                        results.push({
                            id: `${author.toLowerCase()}-${urlName || title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                            title,
                            author,
                            baseUrl: baseUrl || url.substring(0, url.lastIndexOf('/')),
                            urlName: urlName || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                            link: url.startsWith('http') ? url : `https://ccel.org${url.startsWith('/') ? '' : '/'}${url}`,
                            cover: '/placeholder-cover.jpg'
                        });
                    }
                });
            }
            
            // Filter out duplicate entries and entries without titles
            const filteredResults = results
                .filter((book, index, self) => 
                    book.title && 
                    book.title !== "Unknown Title" &&
                    book.title !== "Read online" &&
                    index === self.findIndex(b => b.id === book.id)
                );
            
            console.log(`Final count: Found ${filteredResults.length} filtered results for query "${query}"`);
            return res.json({ results: filteredResults });
        }
    } catch (error) {
        console.error('Error searching CCEL:', error);
        
        // Log more details about the error
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }
        
        return res.status(500).json({ 
            error: 'Failed to search CCEL API', 
            details: error.message,
            errorType: error.code || 'unknown'
        });
    }
});

// Add new endpoint for adding a book to the user's library
app.post('/api/add-to-library', (req, res) => {
    // In a real implementation, this would store the book in a database
    // For now, we'll just return success
    const book = req.body;
    console.log('Adding book to library:', book);
    
    return res.json({ success: true, message: 'Book added to library' });
});

// New endpoint to check the API status
app.get('/api/ccel-status', async (req, res) => {
    try {
        console.log('Checking API status...');
        const statusUrl = `https://search.ccel.org/api/status?api_key=${API_KEY}&api_user_id=${API_USER_ID}`;
        console.log('Status URL:', statusUrl);
        
        // First try direct API check
        try {
            const response = await axios.get(statusUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            console.log('API Status Response:', response.data);
            
            return res.json({
                status: response.data.status || 'unknown',
                message: response.data.message || 'No message provided',
                raw: response.data
            });
        } catch (statusError) {
            console.error('Error with status API, trying a test search instead:', statusError);
            
            // If status check fails, try a basic search to see if API is working
            const testSearchUrl = `https://search.ccel.org/api/search/results/test?api_key=${API_KEY}&api_user_id=${API_USER_ID}&uid=1`;
            
            const searchResponse = await axios.get(testSearchUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            console.log('API Test Search Response Status:', searchResponse.status);
            
            // If we get here, the search API works even if status endpoint doesn't
            return res.json({
                status: 'ok',
                message: 'API is responding to search requests',
                searchTestStatus: searchResponse.status
            });
        }
    } catch (error) {
        console.error('Error checking API status:', error);
        
        // Detailed error logging
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
            console.error('Error response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        }
        
        return res.status(500).json({ 
            error: 'Failed to check API status', 
            details: error.message,
            errorType: error.code || 'unknown'
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});