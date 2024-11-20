import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import books from './Books';
import './BookReader.css';
import OpenAIService from '../services/openAIService';
import { auth, saveModernization, getModernizations, deleteModernization } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
    const [modernizationHistory, setModernizationHistory] = useState({});
    const [user, setUser] = useState(null);
    const [isLoadingModernizations, setIsLoadingModernizations] = useState(false);
    const openAIService = new OpenAIService(process.env.REACT_APP_OPENAI_API_KEY);

    // Array of CCEL's section identifiers
    const sections = ['i', 'ii', 'iii', 'iii.i', 'iii.ii', 'iii.iii', 'iii.iv', 'iv', 'iv.i', 'iv.ii'];

    // Firebase auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadModernizations();
            }
        });

        return () => unsubscribe();
    }, [currentSection]);

    // Load modernizations from Firebase
    const loadModernizations = async () => {
        if (!user || !book) return;

        setIsLoadingModernizations(true);
        try {
            const { history, error } = await getModernizations(book.title, currentSection);
            if (!error && history.length > 0) {
                // Set the most recent modernization as the current one
                setModernizedContent(history[history.length - 1].text);
                
                // Update modernization history
                setModernizationHistory(prev => ({
                    ...prev,
                    [currentSection]: history.map(item => item.text)
                }));
            }
        } catch (error) {
            console.error('Error loading modernizations:', error);
            setError('Failed to load modernization history.');
        } finally {
            setIsLoadingModernizations(false);
        }
    };
    
    const loadContent = async (section) => {
        if (!book?.link) return;

        try {
            setLoading(true);
            setError(null);
            setModernizedContent(''); // Reset modernized content when loading new section

            const baseUrl = book.link.split('practice.')[0];
            const pageUrl = `${baseUrl}practice.${section}.html`;
            
            console.log('Fetching URL:', pageUrl);

            const response = await axios.get(`http://localhost:3001/api/fetch-content?url=${encodeURIComponent(pageUrl)}`);
            
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

    useEffect(() => {
        loadContent(currentSection);
    }, [currentSection, book]);

    const handleNextSection = () => {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            setCurrentSection(nextSection);
            setModernizedContent('');
            window.scrollTo(0, 0);
        }
    };

    const handlePreviousSection = () => {
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            setCurrentSection(prevSection);
            setModernizedContent('');
            window.scrollTo(0, 0);
        }
    };

    const handleModernizeText = async () => {
        if (!user) {
            setError('Please sign in to modernize text.');
            return;
        }

        try {
            setIsModernizing(true);
            setError(null);
            
            const textToModernize = content.replace(/<[^>]+>/g, '');
            const modernizedText = await openAIService.modernizeText(textToModernize);
            
            // Save to Firebase
            const { error: saveError } = await saveModernization(book.title, currentSection, modernizedText);
            if (saveError) {
                throw new Error(saveError);
            }
            
            setModernizedContent(modernizedText);
            
            // Update local state
            setModernizationHistory(prev => ({
                ...prev,
                [currentSection]: [...(prev[currentSection] || []), modernizedText]
            }));
        } catch (error) {
            console.error('Error modernizing text:', error);
            setError('Failed to modernize text. Please try again.');
        } finally {
            setIsModernizing(false);
        }
    };

    const handleDeleteModernization = async (text, index) => {
        if (!user || !book) return;

        try {
            const { history } = await getModernizations(book.title, currentSection);
            const itemToDelete = history.find((item, idx) => idx === index);
            
            if (itemToDelete) {
                await deleteModernization(book.title, currentSection, itemToDelete.timestamp);
                
                // Update local state
                const updatedHistory = modernizationHistory[currentSection].filter((_, idx) => idx !== index);
                setModernizationHistory(prev => ({
                    ...prev,
                    [currentSection]: updatedHistory
                }));

                // If we deleted the current modernization, update to the most recent one
                if (text === modernizedContent && updatedHistory.length > 0) {
                    setModernizedContent(updatedHistory[updatedHistory.length - 1]);
                }
            }
        } catch (error) {
            console.error('Error deleting modernization:', error);
            setError('Failed to delete modernization.');
        }
    };

    const handleChapterChange = (e) => {
        const chapterId = e.target.value;
        setSelectedChapter(chapterId);
        setUserAnswers({});
    };

    const handleAnswerChange = (index, value) => {
        setUserAnswers(prevAnswers => ({ ...prevAnswers, [index]: value }));
    };

    const checkAnswer = (index, correctAnswer) => {
        return userAnswers[index] && userAnswers[index].toLowerCase() === correctAnswer.toLowerCase();
    };

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    const renderPanelContent = () => {
        if (!user) {
            return (
                <div className="panel-content">
                    <p>Please sign in to use the modernization feature.</p>
                </div>
            );
        }

        if (isLoadingModernizations || isModernizing) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{isModernizing ? 'Modernizing text...' : 'Loading modernizations...'}</p>
                </div>
            );
        }

        return (
            <div className="panel-content">
                <button 
                    onClick={handleModernizeText}
                    className="modernize-button"
                    disabled={isModernizing}
                >
                    {modernizedContent ? 'Modernize Again' : 'Modernize Text'}
                </button>
                
                {modernizedContent && (
                    <div className="modernized-text">
                        <h4>Latest Modernization:</h4>
                        {modernizedContent}
                    </div>
                )}
                
                {modernizationHistory[currentSection]?.length > 1 && (
                    <div className="modernization-history">
                        <h4>Previous Modernizations:</h4>
                        {modernizationHistory[currentSection].slice(0, -1).reverse().map((text, index) => (
                            <div key={index} className="previous-modernization">
                                <div className="modernization-header">
                                    <h5>Attempt {modernizationHistory[currentSection].length - index - 1}</h5>
                                    <button
                                        onClick={() => handleDeleteModernization(text, index)}
                                        className="delete-modernization-button"
                                        aria-label="Delete modernization"
                                    >
                                        ×
                                    </button>
                                </div>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
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
                </div>
    
                <div className="navigation-controls">
                    <button 
                        onClick={handlePreviousSection}
                        disabled={sections.indexOf(currentSection) === 0 || loading}
                        className="nav-button"
                    >
                        Previous Section
                    </button>
                    <span className="page-indicator">Section {currentSection.toUpperCase()}</span>
                    <button 
                        onClick={handleNextSection}
                        disabled={!hasNextSection || loading}
                        className="nav-button"
                    >
                        Next Section
                    </button>
                    <button
                        onClick={togglePanel}
                        className="modernize-button"
                    >
                        {isPanelOpen ? 'Hide Modern Text' : 'Show Modern Text'}
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
                        Previous Section
                    </button>
                    <span className="page-indicator">Section {currentSection.toUpperCase()}</span>
                    <button 
                        onClick={handleNextSection}
                        disabled={!hasNextSection || loading}
                        className="nav-button"
                    >
                        Next Section
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
                {renderPanelContent()}
            </div>
        </div>
    );
};

export default BookReader;