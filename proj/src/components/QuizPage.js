import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClaudeService from '../services/claudeService';

const QuizPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const currentSection = queryParams.get('section');
    const { content, bookTitle, author } = location.state || {};
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [feedback, setFeedback] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [quizHistory, setQuizHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [shouldProceed, setShouldProceed] = useState(false);
    const claudeService = new ClaudeService(process.env.REACT_APP_ANTHROPIC_API_KEY);

    // Generate a unique key for this book section's quiz history
    const getQuizHistoryKey = () => {
        if (!bookTitle || !currentSection) return null;
        return `quiz_history_${bookTitle.replace(/\s+/g, '_').toLowerCase()}_section_${currentSection}`;
    };

    // Load quiz history from localStorage when component mounts
    useEffect(() => {
        const historyKey = getQuizHistoryKey();
        if (historyKey) {
            try {
                const savedHistory = localStorage.getItem(historyKey);
                if (savedHistory) {
                    setQuizHistory(JSON.parse(savedHistory));
                }
            } catch (err) {
                console.error('Error loading quiz history:', err);
            }
        }
    }, [bookTitle, currentSection]);

    // Save quiz history to localStorage whenever it changes
    useEffect(() => {
        const historyKey = getQuizHistoryKey();
        if (historyKey && quizHistory.length > 0) {
            try {
                localStorage.setItem(historyKey, JSON.stringify(quizHistory));
            } catch (err) {
                console.error('Error saving quiz history:', err);
                setError('Failed to save quiz history to device.');
            }
        }
    }, [quizHistory]);

    const fetchQuestion = async () => {
        try {
            setLoading(true);
            setError(null);
            setFeedback('');
            setNewQuestion('');
            setIsAnswerSubmitted(false);
            setShouldProceed(false);

            if (!content) {
                setError('No content available to generate questions from.');
                return;
            }
            const cleanContent = content.replace(/<[^>]+>/g, '');
            const prompt = `Based on this text from ${bookTitle} by ${author}, section ${currentSection}:
"${cleanContent}"
Ask a simple, straightforward question about a main point from this section.
Rules:
- Question must be under 30 words
- Focus on basic comprehension
- Use simple, clear language
- Only ask about one concept at a time
- The question should be answerable directly from the text`;
            const response = await claudeService.askQuestion(prompt);
            if (response) {
                setCurrentQuestion(response);
                setAttempts(0); // Reset attempts for new question
            } else {
                setError('Failed to fetch question.');
            }
        } catch (err) {
            setError('Error fetching question. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const parseResponse = (response) => {
        // Check if response contains phrases indicating a new question
        const newQuestionIndicators = [
            'New question:',
            'Next question:',
            'Another question:',
            'Let me ask you:',
            'Now let\'s try:',
            'Let\'s move on to a new question:'
        ];

        let feedbackText = response;
        let newQuestionText = '';
        let shouldAdvance = false;

        // Check if the response suggests we should move to a new question
        const moveOnPhrases = [
            'The correct answer is',
            'That\'s correct',
            'You\'re right',
            'Great job',
            'Well done',
            'Excellent work',
            'Perfect',
            'Exactly right'
        ];

        // If any of these phrases are in the response, we should detect it's time to move on
        for (const phrase of moveOnPhrases) {
            if (response.toLowerCase().includes(phrase.toLowerCase())) {
                shouldAdvance = true;
                break;
            }
        }

        // Look for a new question in the response
        for (const indicator of newQuestionIndicators) {
            if (response.includes(indicator)) {
                const parts = response.split(indicator);
                feedbackText = parts[0].trim();
                newQuestionText = indicator + parts[1].trim();
                // If we found a new question, definitely should move on
                shouldAdvance = true;
                break;
            }
        }

        return {
            feedback: feedbackText,
            newQuestion: newQuestionText,
            shouldAdvance
        };
    };

    const handleSubmitAnswer = async () => {
        if (!userAnswer) return;
        try {
            setLoading(true);
            setError(null);

            // Create timestamp for this quiz interaction
            const timestamp = new Date().toISOString();

            const userResponse = {
                question: currentQuestion,
                answer: userAnswer,
                timestamp,
                bookTitle,
                section: currentSection
            };

            // Update quiz history with new entry
            const updatedHistory = [...quizHistory, userResponse];
            setQuizHistory(updatedHistory);

            const cleanContent = content.replace(/<[^>]+>/g, '');

            // Check if user answered with some variant of "I don't know"
            const dontKnowPatterns = [
                /i\s+don'?t\s+know/i,
                /not\s+sure/i,
                /no\s+idea/i,
                /no\s+clue/i,
                /can'?t\s+tell/i,
                /can'?t\s+remember/i,
                /unsure/i,
                /don'?t\s+remember/i
            ];

            const isAnswerDontKnow = dontKnowPatterns.some(pattern =>
                pattern.test(userAnswer.toLowerCase()));

            let evaluationPrompt;

            if (isAnswerDontKnow) {
                evaluationPrompt = `Based on this text from ${bookTitle}: "${cleanContent}"
The question was: ${currentQuestion}
The user answered that they don't know.
Provide a clear, direct answer to the question based on the text, starting with "The correct answer is:" and then explain the answer with reference to the text content.
Only if the explanation is complete, on a new paragraph starting with "New question:", ask a new, simple question about a different part of the text.
Remember:
- New question must be under 30 words
- Focus on basic comprehension
- Use simple, clear language
- Only ask about one concept at a time
- The question should be answerable directly from the text`;
            } else if (attempts < 1) {
                evaluationPrompt = `Based on this text from ${bookTitle}: "${cleanContent}"
The question was: ${currentQuestion}
The user answered: ${userAnswer}

Evaluate the answer and:
1. If the answer is CORRECT: 
   - Start with positive feedback like "That's correct!" or "Well done!"
   - Give a brief explanation of why it's correct
   - Then on a new paragraph starting with "New question:", ask a new question about a different part of the text

2. If the answer is WRONG or INCOMPLETE:
   - Give gentle feedback explaining what's missing or incorrect
   - DO NOT provide the complete correct answer yet
   - DO NOT ask a new question
   - Instead, encourage them to try again with the SAME question
   - You may provide a small hint

Keep your response conversational and encouraging.`;
            } else {
                evaluationPrompt = `Based on this text from ${bookTitle}: "${cleanContent}"
The question was: ${currentQuestion}
The user answered: ${userAnswer}
This is their final attempt on this question.

Provide a detailed explanation of the correct answer, including relevant information from the text. Start with "The correct answer is..."

Then, on a new paragraph starting with "New question:", ask a new, simple question about a different part of the text.

Remember:
- New question must be under 30 words
- Focus on basic comprehension
- Use simple, clear language
- Only ask about one concept at a time
- The question should be answerable directly from the text`;
            }

            const response = await claudeService.askQuestion(evaluationPrompt);
            if (response) {
                const { feedback, newQuestion: nextQuestion, shouldAdvance } = parseResponse(response);

                setFeedback(feedback);
                setNewQuestion(nextQuestion);
                setIsAnswerSubmitted(true);
                setShouldProceed(shouldAdvance);

                if (shouldAdvance) {
                    // If we should advance to a new question, reset attempts
                    setAttempts(0);
                } else {
                    // Otherwise, increment attempts for the same question
                    setAttempts(prev => prev + 1);
                }
            } else {
                setError('Failed to evaluate answer.');
            }
        } catch (err) {
            setError('Error submitting answer. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
            setUserAnswer('');
        }
    };

    const handleExit = () => {
        navigate(-1);
    };

    // Clear quiz history for this section
    const handleClearHistory = () => {
        const historyKey = getQuizHistoryKey();
        if (historyKey) {
            try {
                localStorage.removeItem(historyKey);
                setQuizHistory([]);
            } catch (err) {
                console.error('Error clearing quiz history:', err);
                setError('Failed to clear quiz history.');
            }
        }
    };

    // Handle moving to the next question
    const handleNextQuestion = () => {
        if (newQuestion) {
            // Extract just the question text without the prefix
            const cleanQuestion = newQuestion.replace(/^(New question:|Next question:|Another question:|Let me ask you:|Now let's try:|Let's move on to a new question:)\s*/i, '');
            setCurrentQuestion(cleanQuestion);
            setFeedback('');
            setNewQuestion('');
            setIsAnswerSubmitted(false);
            setShouldProceed(false);
        } else {
            fetchQuestion();
        }
    };

    // Handle trying again with the same question
    const handleTryAgain = () => {
        setIsAnswerSubmitted(false);
    };

    useEffect(() => {
        fetchQuestion();
    }, [currentSection]);

    if (!content) {
        return (
            <div className="quiz-overlay">
                <div className="quiz-modal">
                    <div className="quiz-container">
                        <div className="quiz-header">
                            <h1>Error</h1>
                            <button onClick={handleExit} className="exit-button">×</button>
                        </div>
                        <p className="error">Unable to load quiz content. Please try again.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-overlay">
            <div className="quiz-modal">
                <div className="quiz-container">
                    <div className="quiz-header">
                        <h1>Take the Quiz</h1>
                        <button
                            onClick={handleExit}
                            className="exit-button"
                            aria-label="Exit quiz"
                        >
                            ×
                        </button>
                    </div>
                    {loading && <p className="loading">Loading...</p>}
                    {error && <p className="error">{error}</p>}

                    {/* Current Question Area */}
                    <div className="quiz-content">
                        <div className="question-card">
                            <h3>Question:</h3>
                            <p>{currentQuestion}</p>
                        </div>

                        {/* Feedback Area - only show if there is feedback */}
                        {isAnswerSubmitted && feedback && (
                            <div className="feedback-card">
                                <h3>Feedback:</h3>
                                <p>{feedback}</p>
                            </div>
                        )}

                        {/* New Question Area - only show if there is a new question AND we should proceed */}
                        {isAnswerSubmitted && newQuestion && shouldProceed && (
                            <div className="new-question-card">
                                <h3>New Question:</h3>
                                <p>{newQuestion.replace(/^(New question:|Next question:|Another question:|Let me ask you:|Now let's try:|Let's move on to a new question:)\s*/i, '')}</p>
                                <button
                                    onClick={handleNextQuestion}
                                    className="continue-button"
                                    disabled={loading}
                                >
                                    Continue with this question
                                </button>
                            </div>
                        )}

                        {/* Answer Input Area - only show if not showing feedback or we're allowing a retry */}
                        {!isAnswerSubmitted && (
                            <>
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="Your answer here..."
                                    rows={4}
                                />
                                <div className="quiz-actions">
                                    <button
                                        onClick={handleSubmitAnswer}
                                        disabled={loading || !userAnswer}
                                    >
                                        Submit Answer
                                    </button>
                                    <button
                                        onClick={fetchQuestion}
                                        disabled={loading}
                                    >
                                        Skip to New Question
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Action buttons when feedback is shown */}
                        {isAnswerSubmitted && (
                            <div className="quiz-actions">
                                {/* Only show try again if we shouldn't proceed yet */}
                                {!shouldProceed && (
                                    <button
                                        onClick={handleTryAgain}
                                        disabled={loading}
                                        className="try-again-button"
                                    >
                                        Try Again
                                    </button>
                                )}
                                {/* Always show option to get new question */}
                                <button
                                    onClick={fetchQuestion}
                                    disabled={loading}
                                >
                                    Get New Question
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="quiz-history">
                        <div className="quiz-history-header">
                            <h3>Quiz History</h3>
                            {quizHistory.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="clear-history-button"
                                >
                                    Clear History
                                </button>
                            )}
                        </div>
                        {quizHistory.length > 0 ? (
                            <ul>
                                {quizHistory.map((entry, index) => (
                                    <li key={index}>
                                        <div className="quiz-history-item">
                                            <div className="quiz-history-meta">
                                                {entry.timestamp && (
                                                    <span className="quiz-history-date">
                                                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="quiz-history-content">
                                                <strong>Q:</strong> {entry.question}
                                                <br />
                                                <strong>A:</strong> {entry.answer}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No history yet.</p>
                        )}
                    </div>
                    <style jsx>{`
                        .quiz-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background-color: rgba(0, 0, 0, 0.7);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 1000;
                        }
                        .quiz-modal {
                            background: #2c2c2c;
                            border-radius: 8px;
                            max-width: 800px;
                            width: 90%;
                            max-height: 90vh;
                            overflow-y: auto;
                            position: relative;
                        }
                        .quiz-container {
                            padding: 20px;
                            color: #e0e0e0;
                        }
                        .quiz-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 1.5rem;
                        }
                        .exit-button {
                            background: none;
                            border: none;
                            font-size: 2rem;
                            cursor: pointer;
                            color: #e0e0e0;
                            padding: 0.5rem;
                            transition: color 0.2s;
                        }
                        .exit-button:hover {
                            color: #ffffff;
                        }
                        .quiz-content {
                            margin-bottom: 20px;
                        }
                        .question-card, .feedback-card, .new-question-card {
                            padding: 15px;
                            margin-bottom: 15px;
                            border-radius: 6px;
                        }
                        .question-card {
                            background: #3d3d3d;
                            border-left: 4px solid #4CAF50;
                        }
                        .feedback-card {
                            background: #383838;
                            border-left: 4px solid #2196F3;
                        }
                        .new-question-card {
                            background: #403d40;
                            border-left: 4px solid #FF9800;
                            position: relative;
                        }
                        .question-card h3, .feedback-card h3, .new-question-card h3 {
                            margin-top: 0;
                            margin-bottom: 10px;
                            color: #ffffff;
                            font-size: 16px;
                            font-weight: bold;
                        }
                        .question-card p, .feedback-card p, .new-question-card p {
                            margin: 0;
                            color: #e0e0e0;
                            line-height: 1.5;
                        }
                        .continue-button {
                            display: block;
                            margin-top: 15px;
                            padding: 8px 16px;
                            background: #FF9800;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: background 0.3s ease;
                        }
                        .continue-button:hover {
                            background: #F57C00;
                        }
                        .continue-button:disabled {
                            background: #a87c50;
                            cursor: not-allowed;
                        }
                        .try-again-button {
                            background: #2196F3 !important;
                        }
                        .try-again-button:hover {
                            background: #1976D2 !important;
                        }
                        textarea {
                            width: 100%;
                            padding: 10px;
                            margin-top: 15px;
                            font-size: 16px;
                            border-radius: 4px;
                            border: 1px solid #444;
                            background: #333;
                            color: #fff;
                        }
                        .quiz-actions {
                            display: flex;
                            justify-content: center;
                            flex-wrap: wrap;
                            margin-top: 15px;
                        }
                        .quiz-actions button {
                            margin: 10px;
                            padding: 10px 20px;
                            border-radius: 4px;
                            border: none;
                            background: #4CAF50;
                            color: white;
                            cursor: pointer;
                            transition: background 0.3s ease;
                        }
                        .quiz-actions button:hover {
                            background: #3e8e41;
                        }
                        .quiz-actions button:disabled {
                            background: #666;
                            cursor: not-allowed;
                        }
                        .quiz-history {
                            margin-top: 30px;
                            border-top: 1px solid #444;
                            padding-top: 15px;
                        }
                        .quiz-history-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 15px;
                        }
                        .clear-history-button {
                            background: #f44336;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 5px 10px;
                            font-size: 14px;
                            cursor: pointer;
                            transition: background 0.3s ease;
                        }
                        .clear-history-button:hover {
                            background: #d32f2f;
                        }
                        .quiz-history ul {
                            list-style-type: none;
                            padding: 0;
                        }
                        .quiz-history li {
                            margin-bottom: 15px;
                        }
                        .quiz-history-item {
                            background: #3a3a3a;
                            padding: 15px;
                            border-radius: 4px;
                            border: 1px solid #555;
                        }
                        .quiz-history-meta {
                            font-size: 12px;
                            color: #aaa;
                            margin-bottom: 8px;
                        }
                        .quiz-history-content {
                            line-height: 1.5;
                        }
                        .loading {
                            text-align: center;
                            font-style: italic;
                            color: #aaa;
                        }
                        .error {
                            color: #ff4d4d;
                            font-weight: bold;
                            text-align: center;
                            padding: 10px;
                            background: rgba(255, 0, 0, 0.1);
                            border-radius: 4px;
                            margin: 10px 0;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;