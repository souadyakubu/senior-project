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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});