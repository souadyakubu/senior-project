import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import books from './Books';
import './BookReader.css';
import OpenAIService from '../services/openAIService';

const BookReader = () => {
    const { bookTitle } = useParams();
    const book = books.find(b => b.title === decodeURIComponent(bookTitle));
    const navigate = useNavigate();
    const openAIService = new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY);

    // State Management
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUrl, setCurrentUrl] = useState(null);
    const [isLastPage, setIsLastPage] = useState(false);
    
    // Modernization Panel State
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isModernizing, setIsModernizing] = useState(false);
    const [modernizedContent, setModernizedContent] = useState('');
    
    // Helper function to get next Roman numeral
    const getNextRomanNumeral = (current) => {
        const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
        const currentIndex = romanNumerals.indexOf(current);
        return currentIndex < romanNumerals.length - 1 ? romanNumerals[currentIndex + 1] : null;
    };
    
    const checkIfPageHasContent = async (url) => {
        try {
            const response = await axios.get('http://localhost:3001/api/fetch-content', {
                params: { url }
            });
            return !response.data.error && response.data.content && response.data.content.trim() !== '';
        } catch (err) {
            return false;
        }
    };
    
    const generateNextPageUrl = async (currentUrl) => {
        if (!currentUrl) {
            return `${book.baseUrl}/${book.urlName}.i.html`;
        }

        const baseUrl = book.baseUrl;
        let section = currentUrl.split('/').pop().replace('.html', '');
        let nextUrl = null;

        // Case 1: Starting point (.i -> .i.i)
        if (section === '.i') {
            nextUrl = `${baseUrl}/${book.urlName}.i.i.html`;
            if (await checkIfPageHasContent(nextUrl)) return nextUrl;
        }

        // Case 2: Main section (like .ii -> .ii.i)
        else if (section.startsWith('.') && section.length === 2) {
            nextUrl = `${baseUrl}/${book.urlName}${section}.i.html`;
            if (await checkIfPageHasContent(nextUrl)) return nextUrl;
        }

        // Case 3: Subsection (.i.i -> .i.ii -> .i.iii -> .ii)
        else if (section.includes('.')) {
            const parts = section.split('.');
            const mainSection = parts[1];
            const currentSubSection = parts[2];

            // Try next subsection
            const nextSubSection = getNextRomanNumeral(currentSubSection);
            if (nextSubSection) {
                nextUrl = `${baseUrl}/${book.urlName}.${mainSection}.${nextSubSection}.html`;
                if (await checkIfPageHasContent(nextUrl)) {
                    return nextUrl;
                }
            }

            // If no next subsection, try next main section
            const nextMainSection = getNextRomanNumeral(mainSection);
            if (nextMainSection) {
                nextUrl = `${baseUrl}/${book.urlName}.${nextMainSection}.html`;
                if (await checkIfPageHasContent(nextUrl)) {
                    return nextUrl;
                }
            }
        }

        return null;
    };

    const generatePreviousPageUrl = (currentUrl) => {
        const startUrl = `${book.baseUrl}/${book.urlName}.i.html`;
        if (!currentUrl || currentUrl === startUrl) {
            return null;
        }

        const baseUrl = book.baseUrl;
        let section = currentUrl.split('/').pop().replace('.html', '');

        // Handle subsection transitions
        if (section.includes('.')) {
            const [mainSection, subSection] = section.split('.');
            const cleanMainSection = mainSection.replace('.', '');
            
            if (subSection === 'ii') {
                return `${baseUrl}/${book.urlName}.${cleanMainSection}.i.html`;
            }
            else if (subSection === 'i') {
                return `${baseUrl}/${book.urlName}.${cleanMainSection}.html`;
            }
        } else {
            section = section.replace('.', '');
            const prevMainSection = String.fromCharCode(section.charCodeAt(0) - 1);
            return `${baseUrl}/${book.urlName}.${prevMainSection}.ii.html`;
        }
    };

    const loadContent = async (url) => {
        if (!url) return;

        try {
            setLoading(true);
            setError(null);
            setModernizedContent('');

            console.log('Loading content from:', url);

            const response = await axios.get('http://localhost:3001/api/fetch-content', {
                params: { url }
            });

            if (response.data.error) {
                if (response.data.error.includes('404')) {
                    setIsLastPage(true);
                } else {
                    setError(response.data.error);
                }
                return;
            }

            if (response.data.content) {
                setContent(response.data.content);
                setIsLastPage(false);
            }
        } catch (err) {
            console.error('Error loading content:', err);
            setError('Failed to load content. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (book) {
            const startUrl = `${book.baseUrl}/${book.urlName}.i.html`;
            setCurrentUrl(startUrl);
            loadContent(startUrl);
        }
    }, [book]);

    const handleNextSection = async () => {
        setLoading(true);
        const nextUrl = await generateNextPageUrl(currentUrl);
        if (nextUrl) {
            setCurrentUrl(nextUrl);
            await loadContent(nextUrl);
            window.scrollTo(0, 0);
        } else {
            setIsLastPage(true);
        }
        setLoading(false);
    };
    
    const handlePreviousSection = async () => {
        setLoading(true);
        const prevUrl = generatePreviousPageUrl(currentUrl);
        if (prevUrl) {
            setCurrentUrl(prevUrl);
            await loadContent(prevUrl);
            window.scrollTo(0, 0);
        }
        setLoading(false);
    };

    const getCurrentSection = () => {
        if (!currentUrl) return '';
        const section = currentUrl.split('/').pop().replace('.html', '');
        return section.replace('.', '');
    };

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
        if (!isPanelOpen && !modernizedContent && !isModernizing) {
            handleModernizeText();
        }
    };

    const handleModernizeText = async () => {
        try {
            setIsModernizing(true);
            const textToModernize = content.replace(/<[^>]+>/g, '');
            const modernizedText = await openAIService.modernizeText(textToModernize);
            setModernizedContent(modernizedText);
        } catch (error) {
            console.error('Error modernizing text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    if (!book) {
        return <h2>Book not found</h2>;
    }

    return (
        <div className="book-reader-container">
            <div className={`book-reader ${isPanelOpen ? 'with-panel' : ''}`}>
                <div className="book-header">
                    <h2>{book.title}</h2>
                    <p><strong>Author:</strong> {book.author}</p>
                    <p className="section-indicator">Section {getCurrentSection()}</p>
                </div>

                <div className="navigation-controls">
                    <button
                        onClick={handlePreviousSection}
                        disabled={!currentUrl || currentUrl === `${book.baseUrl}/${book.urlName}.i.html` || loading}
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
                        disabled={isLastPage || loading}
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
                        disabled={!currentUrl || currentUrl === `${book.baseUrl}/${book.urlName}.i.html` || loading}
                        className="nav-button"
                    >
                        ◀
                    </button>
                    <button
                        className="quiz-button"
                        onClick={() => navigate(`/quiz?section=${getCurrentSection()}`)}
                    >
                        Take Quiz
                    </button>
                    <button
                        onClick={handleNextSection}
                        disabled={isLastPage || loading}
                        className="nav-button"
                    >
                        ▶
                    </button>
                </div>
            </div>

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
    );
};

export default BookReader;