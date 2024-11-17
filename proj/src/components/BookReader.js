import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import books from './Books';
import './BookReader.css';

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
    const [modernizedContent, setModernizedContent] = useState('');
    
    

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

    useEffect(() => {
        loadContent(currentSection);
    }, [currentSection, book]);

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

    // Quiz functionality
    const chapters = [
        { id: '1', title: 'Chapter 1' },
        { id: '2', title: 'Chapter 2' },
        { id: '3', title: 'Chapter 3' },
    ];

    const chapterQuestions = {
        '1': [
            { question: "What is the main theme?", answer: "Theme1" },
            { question: "Who are the key characters?", answer: "Characters1" }
        ],
        '2': [
            { question: "What challenges are introduced?", answer: "Challenges" },
            { question: "How does the character react?", answer: "Reaction" }
        ],
        '3': [
            { question: "What lessons are learned?", answer: "Lesson" },
            { question: "How does the chapter conclude?", answer: "Conclusion" }
        ]
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
                
                <div className="chapter-selection">
                    <h3>Select a Chapter</h3>
                    <select onChange={handleChapterChange} value={selectedChapter}>
                        <option value="">Select a chapter</option>
                        {chapters.map((chapter) => (
                            <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                        ))}
                    </select>
    
                    {selectedChapter && (
                        <div className="chapter-questions">
                            <ul>
                                {chapterQuestions[selectedChapter].map((item, index) => (
                                    <li key={index}>
                                        <p>{item.question}</p>
                                        <input
                                            type="text"
                                            value={userAnswers[index] || ''}
                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                            placeholder="Type your answer here"
                                        />
                                        <button onClick={() => alert(checkAnswer(index, item.answer) ? "Correct!" : "Try again!")}>
                                            Check Answer
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
    
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
        {modernizedContent || 
            <div className="placeholder-text">
                Click "Modernize" to see the modern translation of the text.
            </div>
        }
    </div>
</div>
        </div>
    );
};
export default BookReader;
 
