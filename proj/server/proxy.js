const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

app.get('/api/fetch-content', async (req, res) => {
    try {
        const url = req.query.url;
        console.log('Attempting to fetch:', url);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            }
        });

        const $ = cheerio.load(response.data);
        
        // Remove unwanted elements
        $('script').remove();
        $('style').remove();
        $('.book_navbar').remove();
        $('.navbar').remove();
        $('.selection-popup').remove();

        // Try multiple selectors for the content
        let mainContent = $('.book-content').html() || 
                         $('#theText').html() || 
                         $('.content').html() ||
                         $('#content').html();

        if (!mainContent) {
            console.log('No content found for URL:', url);
            return res.status(404).json({ 
                error: 'Content not found',
                url: url 
            });
        }

        // Clean up the content
        mainContent = mainContent
            .replace(/\n\s+/g, '\n')
            .replace(/<span class="pb".*?<\/span>/g, '')
            .replace(/href="\//g, 'href="https://ccel.org/')
            .replace(/src="\//g, 'src="https://ccel.org/');

        console.log('Content found and processed for URL:', url);
        res.json({ 
            content: mainContent,
            status: 'success',
            url: url // Return the URL for debugging
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});