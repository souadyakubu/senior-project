const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/api/fetch-content', async (req, res) => {
    try {
        const url = req.query.url;
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

app.get('/api/search-ccel', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
  
      console.log('Searching CCEL for:', query);
      
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
      
      // Save the HTML to a file for inspection
      const fs = require('fs');
      fs.writeFileSync('ccel_response.html', response.data);
      console.log('Saved CCEL response to ccel_response.html for inspection');
      
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
        
        if (title && url) {
          console.log(`Found result: "${title}" by ${author || 'Unknown'} at ${url}`);
          
          // Extract baseUrl and urlName from the URL
          let baseUrl = '';
          let urlName = '';
          
          try {
            // Example URL: https://ccel.org/ccel/calvin/institutes/institutes.i.html
            // We want baseUrl: https://ccel.org/ccel/calvin/institutes
            // and urlName: institutes
            const urlParts = url.split('/');
            const ccelIndex = urlParts.indexOf('ccel');
            
            if (ccelIndex >= 0 && ccelIndex + 2 < urlParts.length) {
              urlName = urlParts[ccelIndex + 2];
              baseUrl = urlParts.slice(0, ccelIndex + 3).join('/');
            }
          } catch (e) {
            console.error('Error parsing URL:', e);
          }
          
          results.push({
            id: `${author || 'unknown'}-${urlName || title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            title,
            author: author || 'Unknown',
            baseUrl: baseUrl || url.substring(0, url.lastIndexOf('/')),
            urlName: urlName || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            link: url,
            cover: '/placeholder-cover.jpg'
          });
        }
      });
  
      console.log(`Found ${results.length} results for query "${query}"`);
      
      // If no results found using our selectors, try a different approach
      if (results.length === 0) {
        console.log('No results found with primary selectors, using predefined books for query:', query);
        
        
        // Look for any links to /ccel/ paths which might be search results
        $('a[href*="/ccel/"]').each((index, element) => {
          const el = $(element);
          const url = el.attr('href');
          const title = el.text().trim();
          
          // Skip navigation links and other non-result links
          if (!title || title.length < 5 || title.includes('Home') || title.includes('Menu')) {
            return;
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
  
      console.log(`Final count: Found ${results.length} results for query "${query}"`);
      return res.json({ results });
    } catch (error) {
      console.error('Error searching CCEL:', error);
      return res.status(500).json({ error: error.message });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});