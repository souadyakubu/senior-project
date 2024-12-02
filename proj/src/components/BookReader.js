import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import books from './Books';
import './BookReader.css';
import QuizPage from './QuizPage';
//import ClaudeService from '../services/claudeService';
import OpenAIService from '../services/openAIService';

const BookReader = () => {
    const { bookTitle } = useParams();
    const book = books.find(b => b.title === decodeURIComponent(bookTitle));
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSection, setCurrentSection] = useState('i');
    const [hasNextSection, setHasNextSection] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState('');
    const [userAnswers, setUserAnswers] = useState({});
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isModernizing, setIsModernizing] = useState(false);
    const [modernizedContent, setModernizedContent] = useState('');
    const navigate = useNavigate();
    //const claudeService = new ClaudeService(process.env.REACT_APP_ANTHROPIC_API_KEY);
    const openAIService = new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY);

    // Array of CCEL's section identifiers
    const sections = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

    const loadContent = async (section) => {
        if (!book?.link) return;

        try {
            setLoading(true);
            setError(null);

            // Construct URL based on CCEL's structure
            const baseUrl = book.link.split('practice.')[0];
            const pageUrl = `${baseUrl}practice.${section}.html`;

            console.log('Fetching URL:', pageUrl);

            const response = await axios.get(`http://localhost:3001/api/fetch-content?url=${encodeURIComponent(pageUrl)}`);

            console.log('Raw HTML Response:', response.data.content);  // Log the raw content

            if (response.data.error) {
                console.log('Error response:', response.data.error);
                if (response.data.error.includes('404')) {
                    setHasNextSection(false);
                } else {
                    setError(response.data.error);
                }
                return;
            }

            if (response.data.content) {
                setContent(response.data.content);
                // Check if next section exists
                const nextSectionIndex = sections.indexOf(section) + 1;
                setHasNextSection(nextSectionIndex < sections.length);
            }
        } catch (err) {
            console.error('Error loading content:', err);
            if (err.response?.status === 404) {
                setHasNextSection(false);
            } else {
                setError('Failed to load content. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };



    // Extract content from the HTML response (customize based on the actual HTML structure)
    const extractContentFromHTML = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Try using a more general selector, e.g., first <div>
        const contentDiv = doc.querySelector('div');
        return contentDiv ? contentDiv.innerHTML : 'Content not found';
    };


    const handleNextSection = () => {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            setCurrentSection(nextSection);
            window.scrollTo(0, 0);
        }
    };

    const handlePreviousSection = () => {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            setCurrentSection(prevSection);
            window.scrollTo(0, 0);
        }
    };

    useEffect(() => {
        loadContent(currentSection);
    }, [currentSection, book]);

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
        if (!isPanelOpen && !modernizedContent && !isModernizing) {
            handleModernizeText();
        }
    };

    if (!book) {
        return <h2>Book not found</h2>;
    }

    const handleModernizeText = async () => {
        try {
            setIsModernizing(true);
            // Get the text content from your content state
            // You might need to adjust this depending on how your content is structured
            const textToModernize = content.replace(/<[^>]+>/g, ''); // Remove HTML tags

            //const modernizedText = await claudeService.modernizeText(textToModernize);
            const modernizedText = await openAIService.modernizeText(textToModernize);  // Updated service call

            setModernizedContent(modernizedText);
        } catch (error) {
            console.error('Error modernizing text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    return (
        <div className="book-reader-container">
            <div className={`book-reader ${isPanelOpen ? 'with-panel' : ''}`}>
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
                        onClick={togglePanel}
                        className="modernize-button"
                    >
                        {isPanelOpen ? 'Hide Modern Text' : 'Show Modern Text'}
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

                <div className="navigation-controls bottom">
                    <button
                        onClick={handlePreviousSection}
                        disabled={sections.indexOf(currentSection) === 0 || loading}
                        className="nav-button"
                    >
                        ◀
                    </button>

                    <button
                        className="quiz-button"
                        onClick={() => navigate('/quiz')}  // Using navigate() for routing
                    >
                        Take Quiz
                    </button>

                    <button
                        onClick={handleNextSection}
                        disabled={!hasNextSection || loading}
                        className="nav-button"
                    >
                        ▶
                    </button>
                </div>

                <div className="chapter-selection">


                    {/* Modernized Panel - Moved outside the main content area */}
                    <div className={`modernized-panel ${isPanelOpen ? 'open' : ''}`}>
                        <div className="panel-header">
                            <h3>Modern Translation</h3>
                            <button
                                onClick={togglePanel}
                                className="close-panel-button"
                                aria-label="Close panel"
                            >
                                ×
                            </button>
                        </div>
                        <div className="panel-content">
                            {isModernizing ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <p>Modernizing text...</p>
                                </div>
                            ) : modernizedContent ? (
                                <div className="modernized-text">
                                    {modernizedContent}
                                </div>
                            ) : (
                                <div className="placeholder-text">
                                    Click "Modernize" to see the modern translation of the text.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookReader;



