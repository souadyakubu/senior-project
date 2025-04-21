import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import books from './Books';
import './BookReader.css';
import OpenAIService from '../services/openAIService';
import ClaudeService from '../services/claudeService';
import ChatBox from './ChatBox';

// Import PDF.js directly for text extraction only
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Enhanced text formatting components defined outside the main component
// Component for explanation text formatting
const FormatExplanation = ({ text }) => {
    if (!text) return null;

    // Regular expression to identify numbered sections (1., 2., etc.)
    const processText = (content) => {
        // Split by double newlines or numbered pattern
        // This approach handles Claude's typical formatting better
        const lines = content.split(/\n+/);
        const result = [];
        let currentNumberedSection = null;
        let currentSectionContent = [];

        lines.forEach((line, i) => {
            // Check if this line starts a new numbered section
            const numberMatch = line.match(/^(\d+)\.\s*(.*)/);

            if (numberMatch) {
                // If we have content from a previous section, add it
                if (currentNumberedSection !== null) {
                    result.push(
                        <p key={`section-${currentNumberedSection}`}>
                            <strong>{currentNumberedSection}. </strong>
                            {currentSectionContent.join(' ')}
                        </p>
                    );
                    currentSectionContent = [];
                }

                // Start a new numbered section
                currentNumberedSection = numberMatch[1];
                currentSectionContent.push(numberMatch[2]);
            }
            else if (currentNumberedSection !== null) {
                // Continue existing numbered section
                currentSectionContent.push(line);
            }
            else {
                // Regular paragraph
                result.push(<p key={`para-${i}`}>{line}</p>);
            }
        });

        // Add the final section if there is one
        if (currentNumberedSection !== null) {
            result.push(
                <p key={`section-${currentNumberedSection}`}>
                    <strong>{currentNumberedSection}. </strong>
                    {currentSectionContent.join(' ')}
                </p>
            );
        }

        return result;
    };

    return <div className="explanation-text">{processText(text)}</div>;
};

// Component for historical context formatting - similar approach
const FormatHistoricalContext = ({ text }) => {
    if (!text) return null;

    // Similar processing to explanation formatting
    const processText = (content) => {
        const lines = content.split(/\n+/);
        const result = [];
        let currentNumberedSection = null;
        let currentSectionContent = [];

        lines.forEach((line, i) => {
            const numberMatch = line.match(/^(\d+)\.\s*(.*)/);

            if (numberMatch) {
                if (currentNumberedSection !== null) {
                    result.push(
                        <p key={`section-${currentNumberedSection}`}>
                            <strong>{currentNumberedSection}. </strong>
                            {currentSectionContent.join(' ')}
                        </p>
                    );
                    currentSectionContent = [];
                }

                currentNumberedSection = numberMatch[1];
                currentSectionContent.push(numberMatch[2]);
            }
            else if (currentNumberedSection !== null) {
                currentSectionContent.push(line);
            }
            else {
                result.push(<p key={`para-${i}`}>{line}</p>);
            }
        });

        if (currentNumberedSection !== null) {
            result.push(
                <p key={`section-${currentNumberedSection}`}>
                    <strong>{currentNumberedSection}. </strong>
                    {currentSectionContent.join(' ')}
                </p>
            );
        }

        return result;
    };

    return <div className="explanation-text">{processText(text)}</div>;
};

// Component for modernized text formatting
const FormatModernizedText = ({ text }) => {
    if (!text) return null;

    // Split by newlines to preserve paragraph structure
    const paragraphs = text.split(/\n\n+/);

    return (
        <div className="modernized-text">
            {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
            ))}
        </div>
    );
};

// Main BookReader component
const BookReader = () => {
    const { bookTitle } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const openAIService = new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY);
    const claudeService = new ClaudeService(process.env.REACT_APP_ANTHROPIC_API_KEY);
    const isCCELSearch = location.state?.fromSearch === true;
    const ccelBook = location.state?.ccelBook;

    // PDF-specific state
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfText, setPdfText] = useState('');
    const isPdf = location.state?.isPdf;
    const pdfUrl = location.state?.pdfUrl;
    const pdfName = location.state?.fileName;

    // Existing state
    const book = !isPdf
        ? (isCCELSearch ? ccelBook : books.find(b => b.title === decodeURIComponent(bookTitle)))
        : null;

    // Updated state for panels
    const [chatMessages, setChatMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUrl, setCurrentUrl] = useState(null);
    const [isLastPage, setIsLastPage] = useState(false);

    // Panel state
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isExplanationPanelOpen, setIsExplanationPanelOpen] = useState(false);
    const [isHistoricalContextOpen, setIsHistoricalContextOpen] = useState(false);

    // Content state
    const [isModernizing, setIsModernizing] = useState(false);
    const [modernizedContent, setModernizedContent] = useState('');
    const [explanation, setExplanation] = useState('');
    const [isExplaining, setIsExplaining] = useState(false);
    const [contextInfo, setContextInfo] = useState('');
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    // Selection state
    const [selectedText, setSelectedText] = useState('');
    const [selectionPosition, setSelectionPosition] = useState(null);

    // Console log PDF info for debugging
    useEffect(() => {
        if (isPdf) {
            console.log("PDF Mode:", isPdf);
            console.log("PDF URL:", pdfUrl);
            console.log("PDF Name:", pdfName);
        }
    }, [isPdf, pdfUrl, pdfName]);

    useEffect(() => {
        if (isCCELSearch) {
            console.log("CCEL Book from search:", ccelBook);
        }
    }, [isCCELSearch, ccelBook]);

    // Enhanced PDF handling useEffect
    useEffect(() => {
        if (isPdf && pdfUrl) {
            setLoading(true);
            console.log("PDF mode activated with URL:", pdfUrl);
            console.log("PDF file name:", pdfName);
            
            // Skip the URL testing that's causing errors and just proceed with text extraction
            extractTextFromPdf().catch(err => {
                console.error("Text extraction error:", err);
            }).finally(() => {
                // Set loading to false regardless of text extraction outcome
                // This ensures the PDF will be displayed even if extraction fails
                setTimeout(() => setLoading(false), 500);
            });
        }
    }, [isPdf, pdfUrl, pdfName]);

    // Helper function to get next Roman numeral
    const getNextRomanNumeral = (current) => {
        const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
        const currentIndex = romanNumerals.indexOf(current);
        return currentIndex < romanNumerals.length - 1 ? romanNumerals[currentIndex + 1] : null;
    };

    // Enhanced PDF text extraction function
    const extractTextFromPdf = async () => {
        try {
            console.log("Attempting to extract text from PDF page", pageNumber);
            if (!pdfUrl) {
                console.error("No PDF URL provided");
                return;
            }

            // Set a timeout to prevent hanging if PDF.js fails
            const extractionPromise = new Promise(async (resolve, reject) => {
                try {
                    const loadingTask = pdfjs.getDocument(pdfUrl);
                    const pdf = await loadingTask.promise;
                    
                    // Get total pages
                    setNumPages(pdf.numPages);
                    
                    const page = await pdf.getPage(pageNumber);
                    const textContent = await page.getTextContent();
                    const text = textContent.items.map(item => item.str).join(' ');
                    
                    console.log("Extracted text length:", text.length);
                    setPdfText(text);
                    setContent(text);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
            
            // Set a timeout for extraction
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("PDF text extraction timed out")), 10000);
            });
            
            await Promise.race([extractionPromise, timeoutPromise]);
        } catch (err) {
            console.error('Error extracting text from PDF:', err);
            setPdfText("Text extraction failed. You can still view the PDF but modernization features may be limited.");
            // Don't set loading to false here to allow the iframe to load
        }
    };

    // Existing functions from original code
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
            const parts = section.split('.');
            const mainSection = parts[1];
            const subSection = parts[2];
            const cleanMainSection = parts[1];

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

    // Generate a unique storage key for chat messages
    const getChatStorageKey = (url) => {
        if (!url || !book) return null;
        const section = url.split('/').pop().replace('.html', '');
        return `chat_${book.title}_${section}`.replace(/\s+/g, '_').toLowerCase();
    };

    // Load saved chat messages from localStorage
    const loadSavedChats = (url) => {
        const storageKey = getChatStorageKey(url);
        if (!storageKey) return;

        try {
            const savedChats = localStorage.getItem(storageKey);
            if (savedChats) {
                setChatMessages(JSON.parse(savedChats));
            } else {
                // Reset chat messages if no saved chats found for this section
                setChatMessages([]);
            }
        } catch (err) {
            console.error('Error loading saved chats:', err);
            setChatMessages([]);
        }
    };

    // Save chat messages to localStorage
    const saveChatsToLocalStorage = (messages, url) => {
        const storageKey = getChatStorageKey(url);
        if (!storageKey) return;

        try {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        } catch (err) {
            console.error('Error saving chats to local storage:', err);
        }
    };

    // Navigation functions for both PDF and regular books
    const handleNextSection = async () => {
        if (isPdf) {
            if (pageNumber < numPages) {
                setPageNumber(prevPageNumber => prevPageNumber + 1);
            }
        } else {
            setLoading(true);
            const nextUrl = await generateNextPageUrl(currentUrl);
            if (nextUrl) {
                setCurrentUrl(nextUrl);
                await loadContent(nextUrl);
                window.scrollTo(0, 0);
                // Load saved chats for the new section
                loadSavedChats(nextUrl);
            } else {
                setIsLastPage(true);
            }
            setLoading(false);
        }
    };

    const handlePreviousSection = async () => {
        if (isPdf) {
            if (pageNumber > 1) {
                setPageNumber(prevPageNumber => prevPageNumber - 1);
            }
        } else {
            setLoading(true);
            const prevUrl = generatePreviousPageUrl(currentUrl);
            if (prevUrl) {
                setCurrentUrl(prevUrl);
                await loadContent(prevUrl);
                window.scrollTo(0, 0);
                // Load saved chats for the previous section
                loadSavedChats(prevUrl);
            }
            setLoading(false);
        }
    };

    const getCurrentSection = () => {
        if (isPdf) {
            return `Page ${pageNumber} of ${numPages || '?'}`;
        }
        if (!currentUrl) return '';
        const section = currentUrl.split('/').pop().replace('.html', '');
        return section.replace('.', '');
    };

    // Updated togglePanel function for modernize panel
    const togglePanel = () => {
        const newPanelState = !isPanelOpen;
        setIsPanelOpen(newPanelState);

        // Close other panels when opening this one
        if (newPanelState) {
            setIsExplanationPanelOpen(false);
            setIsHistoricalContextOpen(false);
            setShowExplanation(false);
        }

        // Add/remove CSS class for layout adjustment
        const container = document.querySelector('.book-reader-container');
        if (container) {
            if (newPanelState) {
                container.classList.add('with-panel');
                container.classList.remove('with-explanation', 'with-historical-context');
            } else {
                container.classList.remove('with-panel');
            }
        }

        // Trigger content loading if panel is being opened
        if (newPanelState && !modernizedContent && !isModernizing) {
            handleModernizeText();
        }
    };

    // Feature functions (modernize, explain) for both PDF and regular content
    const handleModernizeText = async () => {
        try {
            setIsModernizing(true);
            const textToModernize = isPdf
                ? pdfText
                : content.replace(/<[^>]+>/g, '');

            const modernizedText = await claudeService.modernizeText(textToModernize);
            setModernizedContent(modernizedText);
        } catch (error) {
            console.error('Error modernizing text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    // Debug function to log selected text
    const handleLogText = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        console.log('Selected text:', text);
    };

    // Updated handleExplainText function for side panel
    const handleExplainText = async () => {
        try {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (!text) {
                return;
            }

            // Close other panels and open explanation panel
            setIsPanelOpen(false);
            setIsHistoricalContextOpen(false);
            setIsExplanationPanelOpen(true);
            setShowExplanation(true);

            // Update CSS classes for layout
            const container = document.querySelector('.book-reader-container');
            if (container) {
                container.classList.remove('with-panel', 'with-historical-context');
                container.classList.add('with-explanation');
            }

            setIsExplaining(true);

            // Create context object with book info and current page content
            const contextData = {
                bookTitle: isPdf ? pdfName : book?.title,
                author: isPdf ? 'Unknown' : book?.author,
                pageContent: isPdf ? pdfText : content.replace(/<[^>]+>/g, '') // Remove HTML tags from content
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

    // Function to close explanation panel
    const closeExplanationPanel = () => {
        setIsExplanationPanelOpen(false);
        setShowExplanation(false);

        // Remove CSS class
        const container = document.querySelector('.book-reader-container');
        if (container) {
            container.classList.remove('with-explanation');
        }
    };

    // Update handleShowContext function for historical context
    const handleShowContext = async () => {
        try {
            // Close other panels and open historical context panel
            setIsPanelOpen(false);
            setIsExplanationPanelOpen(false);
            setShowExplanation(false);
            setIsHistoricalContextOpen(true);

            // Update CSS classes for layout
            const container = document.querySelector('.book-reader-container');
            if (container) {
                container.classList.remove('with-panel', 'with-explanation');
                container.classList.add('with-historical-context');
            }

            setIsLoadingContext(true);

            // Create the prompt for context
            const contextData = {
                bookTitle: isPdf ? pdfName : book?.title,
                author: isPdf ? 'Unknown' : book?.author,
                yearPublished: book?.yearPublished || 'unknown year'
            };

            // Use Claude to get historical context
            const contextResponse = await claudeService.getHistoricalContext(contextData);
            setContextInfo(contextResponse);
        } catch (error) {
            console.error('Error getting historical context:', error);
            setContextInfo('Unable to retrieve historical context information. Please try again.');
        } finally {
            setIsLoadingContext(false);
        }
    };

    // Function to close historical context panel
    const closeHistoricalContextPanel = () => {
        setIsHistoricalContextOpen(false);

        // Remove CSS class
        const container = document.querySelector('.book-reader-container');
        if (container) {
            container.classList.remove('with-historical-context');
        }
    };

    const handleSendMessage = async (message) => {
        try {
            const context = {
                previousMessages: chatMessages,
                book: {
                    title: book?.title || pdfName,
                    author: book?.author || 'Unknown',
                    currentSection: getCurrentSection(),
                    currentContent: content
                }
            };

            // Include the last message and response for context
            const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
            const contextualPrompt = `Current Book: ${book?.title || pdfName} by ${book?.author || 'Unknown'}
    Current Section: ${getCurrentSection()}
    Previous Question: ${lastMessage ? lastMessage.text : 'N/A'}
    Previous Answer: ${lastMessage ? lastMessage.response : 'N/A'}
    
    New Question: ${message}
    
    Please answer the new question taking into account the context of the book, current section, and previous conversation.`;

            const response = await claudeService.askQuestion(contextualPrompt, context);
            const updatedMessages = [...chatMessages, { text: message, response: response }];
            setChatMessages(updatedMessages);

            // Save updated messages to local storage
            saveChatsToLocalStorage(updatedMessages, currentUrl);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text) {
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

            // Close other panels and open modernize panel
            setIsExplanationPanelOpen(false);
            setShowExplanation(false);
            setIsHistoricalContextOpen(false);
            setIsPanelOpen(true);

            // Update CSS classes for layout
            const container = document.querySelector('.book-reader-container');
            if (container) {
                container.classList.remove('with-explanation', 'with-historical-context');
                container.classList.add('with-panel');
            }

            const modernizedText = await claudeService.modernizeText(selectedText);
            setModernizedContent(modernizedText);
            setSelectedText('');
            setSelectionPosition(null);
        } catch (error) {
            console.error('Error modernizing selected text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    // Effects
    useEffect(() => {
        if (isPdf && pdfUrl) {
            setLoading(true);
            console.log("PDF mode activated with URL:", pdfUrl);
            // We'll use the iframe to display, so text extraction happens separately
            extractTextFromPdf();
        } else if (book) {
            const startUrl = `${book.baseUrl}/${book.urlName}.i.html`;
            setCurrentUrl(startUrl);
            loadContent(startUrl);
            // Load saved chats for the initial section
            loadSavedChats(startUrl);
        }
    }, [isPdf, pdfUrl, book]);

    // Effect to extract text when PDF page changes
    useEffect(() => {
        if (isPdf && pdfUrl && pageNumber > 0) {
            console.log("Triggering text extraction for page", pageNumber);
            extractTextFromPdf();
        }
    }, [isPdf, pageNumber]);

    // Text selection effect
    useEffect(() => {
        document.addEventListener('mouseup', handleTextSelection);
        return () => {
            document.removeEventListener('mouseup', handleTextSelection);
        };
    }, []);

    if (!book && !isPdf) {
        return <h2>Book not found</h2>;
    }

    return (
        <div className={`book-reader-container ${isPanelOpen ? 'with-panel' : ''} ${isExplanationPanelOpen ? 'with-explanation' : ''} ${isHistoricalContextOpen ? 'with-historical-context' : ''}`}>
            <div className="book-reader">
                <div className="book-header">
                    <h2>{isPdf ? pdfName : book?.title}</h2>
                    {!isPdf && book && <p><strong>Author:</strong> {book.author}</p>}
                    <p className="section-indicator">{getCurrentSection()}</p>
                </div>

                <div className="navigation-controls">
                    <button
                        onClick={handlePreviousSection}
                        disabled={isPdf ? (pageNumber <= 1) : (!currentUrl || currentUrl === `${book?.baseUrl}/${book?.urlName}.i.html` || loading)}
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
                        onClick={handleShowContext}
                        className="modernize-button"
                    >
                        Historical Context
                    </button>
                    <button
                        onClick={handleNextSection}
                        disabled={isPdf ? (pageNumber >= numPages) : (isLastPage || loading)}
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
                        {isPdf ? (
    <div className="pdf-container">
        {pdfUrl ? (
            <iframe
                src={pdfUrl}
                width="100%"
                height="800px"
                style={{ border: 'none' }}
                title="PDF Viewer"
                onLoad={() => {
                    console.log("PDF iframe loaded successfully");
                    setLoading(false);
                }}
            />
        ) : (
            <div className="error-message">
                No PDF URL provided. Please go back and try uploading again.
            </div>
        )}
    </div>
) : (
    <div
        className="content-container"
        dangerouslySetInnerHTML={{ __html: content }}
    />
)}
                        {selectionPosition && selectedText && (
                            <div
                                className="selection-toolbar"
                                style={{
                                    position: 'absolute',
                                    top: `${selectionPosition.top - 40}px`,
                                    left: `${selectionPosition.left}px`
                                }}
                            >
                                <button onClick={handleModernizeSelection}>Modernize Selection</button>
                                <button onClick={handleExplainText}>Explain Selection</button>
                            </div>
                        )}
                    </div>
                )}

                <div className="navigation-controls bottom">
                    <button
                        onClick={handlePreviousSection}
                        disabled={isPdf ? (pageNumber <= 1) : (!currentUrl || currentUrl === `${book?.baseUrl}/${book?.urlName}.i.html` || loading)}
                        className="nav-button"
                    >
                        ◀
                    </button>
                    {!isPdf && book && (
                        <button
                            className="quiz-button"
                            onClick={() => navigate(`/quiz?section=${getCurrentSection()}`, {
                                state: {
                                    content: content,
                                    bookTitle: book.title,
                                    author: book.author
                                }
                            })}
                        >
                            Take Quiz
                        </button>
                    )}
                    <button
                        onClick={handleNextSection}
                        disabled={isPdf ? (pageNumber >= numPages) : (isLastPage || loading)}
                        className="nav-button"
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* Modernized Panel */}
            <div className={`modernized-panel side-panel ${isPanelOpen ? 'open' : ''}`}>
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
                        <>
                            <FormatModernizedText text={modernizedContent} />
                            {isPanelOpen && (
                                <ChatBox
                                    onSendMessage={handleSendMessage}
                                    claudeService={claudeService}
                                    messages={chatMessages}
                                    bookContext={{
                                        title: book?.title,
                                        author: book?.author,
                                        currentSection: getCurrentSection(),
                                        currentContent: content
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        <div className="placeholder-text">
                            Click "Modernize" to see the modern translation of the text.
                        </div>
                    )}
                </div>
            </div>

            {/* Explanation Panel */}
            <div className={`explanation-panel side-panel ${isExplanationPanelOpen ? 'open' : ''}`}>
                <div className="panel-header">
                    <h3>Text Explanation</h3>
                    <button
                        onClick={closeExplanationPanel}
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
                        <FormatExplanation text={explanation} />
                    ) : (
                        <div className="placeholder-text">
                            Select text and click "Explain Selection" to see an explanation.
                        </div>
                    )}
                </div>
            </div>

            {/* Historical Context Panel */}
            <div className={`historical-context-panel side-panel ${isHistoricalContextOpen ? 'open' : ''}`}>
                <div className="panel-header">
                    <h3>Historical Context</h3>
                    <button
                        onClick={closeHistoricalContextPanel}
                        className="close-panel-button"
                        aria-label="Close panel"
                    >
                        ×
                    </button>
                </div>
                <div className="panel-content">
                    {isLoadingContext ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Researching historical context...</p>
                        </div>
                    ) : contextInfo ? (
                        <FormatHistoricalContext text={contextInfo} />
                    ) : (
                        <div className="placeholder-text">
                            Click "Historical Context" to learn about the historical and cultural background of this work.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookReader;