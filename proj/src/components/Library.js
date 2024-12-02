import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import books from './Books';
import './BookReader.css';
import OpenAIService from '../services/openAIService';

const BookReader = () => {
    const { bookTitle } = useParams();
    const book = books.find(b => b.title === decodeURIComponent(bookTitle));
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSection, setCurrentSection] = useState('i');
    const [hasNextSection, setHasNextSection] = useState(true);
    const navigate = useNavigate();

    // Array of CCEL's section identifiers
    const sections = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

    // Function to load content of a section
    const loadContent = async (section) => {
        if (!book?.link) return;

        try {
            setLoading(true);
            setError(null);

            // Construct URL based on the CCEL structure
            const baseUrl = book.link.split('practice.')[0];
            const pageUrl = `${baseUrl}practice.${section}.html`;

            console.log('Fetching URL:', pageUrl);

            const response = await axios.get(pageUrl);

            if (response.data) {
                // Extract the main content from the response (this will depend on the structure of the CCEL page)
                const extractedContent = extractContentFromHTML(response.data);
                setContent(extractedContent);

                // Check if the next section exists
                const nextSectionIndex = sections.indexOf(section) + 1;
                setHasNextSection(nextSectionIndex < sections.length);
            }
        } catch (err) {
            console.error('Error loading content:', err);
            setError('Failed to load content. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Extract content from the HTML response (customize based on the actual HTML structure)
    const extractContentFromHTML = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Assuming the main content is inside <div class="content"> or adjust based on the CCEL structure
        const contentDiv = doc.querySelector('.content');

        return contentDiv ? contentDiv.innerHTML : 'Content not found';
    };

    // Handle navigating to the next section
    const handleNextSection = () => {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            setCurrentSection(nextSection);
            window.scrollTo(0, 0);
        }
    };

    // Handle navigating to the previous section
    const handlePreviousSection = () => {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            setCurrentSection(prevSection);
            window.scrollTo(0, 0);
        }
    };

    // Fetch the content when the component mounts or the section changes
    useEffect(() => {
        loadContent(currentSection);
    }, [currentSection, book]);

    const handleModernizeText = async () => {
        // Call the OpenAI service to modernize the text, similar to your existing code
    };

    if (!book) {
        return <h2>Book not found</h2>;
    }

    return (
        <div className="book-reader-container">
            <div className="book-reader">
                <div className="book-header">
                    <h2>{book.title} - Section {currentSection.toUpperCase()}</h2>
                    <p><strong>Author:</strong> {book.author}</p>
                </div>

                <div className="navigation-controls">
                    <button
                        onClick={handlePreviousSection}
                        disabled={sections.indexOf(currentSection) === 0 || loading}
                        className="nav-button"
                    >
                        ◀
                    </button>
                    <button
                        onClick={handleNextSection}
                        disabled={!hasNextSection || loading}
                        className="nav-button"
                    >
                        ▶
                    </button>
                </div>

                {loading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading content...</p>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!loading && !error && content && (
                    <div className="book-content">
                        <div
                            className="content-container"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                )}

                <button
                    className="quiz-button"
                    onClick={() => navigate('/quiz')}
                >
                    Take Quiz
                </button>
            </div>
        </div>
    );
};

export default BookReader;
