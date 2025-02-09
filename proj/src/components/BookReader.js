import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import books from './Books';
import './BookReader.css';
import QuizPage from './QuizPage';
import ClaudeService from '../services/claudeService';
//import OpenAIService from '../services/openAIService';
import SelectionPopup from './SelectionPopup';

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
    const claudeService = new ClaudeService(process.env.REACT_APP_ANTHROPIC_API_KEY);
    const [selectedText, setSelectedText] = useState('');
    const [selectionPosition, setSelectionPosition] = useState(null);
    //const openAIService = new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY);
    const [explanation, setExplanation] = useState('');
    const [isExplaining, setIsExplaining] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

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

    useEffect(() => {
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) {
            contentContainer.addEventListener('mouseup', handleTextSelection);
            
            // Clean up listener when component unmounts
            return () => {
                contentContainer.removeEventListener('mouseup', handleTextSelection);
            };
        }
    }, []);

    useEffect(() => {
        if (selectedText) {
            console.log('Selected text:', selectedText);
            console.log('Selection position:', selectionPosition);
        }
    }, [selectedText, selectionPosition]);

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

            const modernizedText = await claudeService.modernizeText(textToModernize);
            //const modernizedText = await openAIService.modernizeText(textToModernize);  // Updated service call

            setModernizedContent(modernizedText);
        } catch (error) {
            console.error('Error modernizing text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            // Get selection coordinates for positioning the modernize button later
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setSelectedText(text);
            setSelectionPosition({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX
            });
        } else {
            setSelectedText('');
            setSelectionPosition(null);
        }
    };

    const handleModernizeSelection = async () => {
        try {
            setIsModernizing(true);
            const modernizedText = await claudeService.modernizeText(selectedText);
            setModernizedContent(modernizedText);
            setIsPanelOpen(true);
            // Clear the selection after modernizing
            setSelectedText('');
            setSelectionPosition(null);
        } catch (error) {
            console.error('Error modernizing selected text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    const handleLogText = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        console.log('Selected text:', text);
    };

    const handleExplainText = async () => {
        try {
            const selection = window.getSelection();
            const text = selection.toString().trim();
    
            if (!text) {
                return;
            }
    
            setIsExplaining(true);
            setShowExplanation(true);
    
            // Create context object with book info and current page content
            const contextData = {
                bookTitle: book.title,
                author: book.author,
                pageContent: content.replace(/<[^>]+>/g, '') // Remove HTML tags from content
            };
    
            const explainedText = await claudeService.explainText(text, contextData);
            setExplanation(explainedText);
        } catch (error) {
            console.error('Error explaining text:', error);
            setError('Failed to explain text. Please try again.');
        } finally {
            setIsExplaining(false);
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
                        onClick={handleExplainText}
                        className="modernize-button"
                    >
                        Explain Selection
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
                        {selectedText && (
                            <SelectionPopup
                                position={selectionPosition}
                                onModernize={handleModernizeSelection}
                            />
                        )}
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
                        onClick={() => navigate(`/quiz?section=${currentSection}`)}
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
    
                {/* Panels */}
                <div className="panels-container">
    {/* Modernized Panel */}
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

    {/* Explanation Panel */}
    <div className={`explanation-panel ${showExplanation ? 'open' : ''}`}>
        <div className="panel-header">
            <h3>Text Explanation</h3>
            <button
                onClick={() => setShowExplanation(false)}
                className="close-panel-button"
                aria-label="Close panel"
            >
                ×
            </button>
        </div>
        <div className="panel-content">
            {isExplaining ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Analyzing text...</p>
                </div>
            ) : explanation ? (
                <div className="explanation-text">
                    {explanation}
                </div>
            ) : (
                <div className="placeholder-text">
                    Select text and click "Explain Selection" to see an explanation.
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



