import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClaudeService from '../services/claudeService';

const QuizPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const currentSection = queryParams.get('section');
    const { content, bookTitle, author } = location.state || {};

    const [question, setQuestion] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [quizHistory, setQuizHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const claudeService = new ClaudeService(process.env.REACT_APP_ANTHROPIC_API_KEY);

    const fetchQuestion = async () => {
        try {
            setLoading(true);
            setError(null);

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
                setQuestion(response);
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

    const handleSubmitAnswer = async () => {
        if (!userAnswer) return;

        try {
            setLoading(true);
            setError(null);

            const userResponse = {
                question,
                answer: userAnswer,
            };

            setQuizHistory([...quizHistory, userResponse]);

            const cleanContent = content.replace(/<[^>]+>/g, '');
            const evaluationPrompt = `Based on this text from ${bookTitle}: "${cleanContent}"

            The question was: ${question}
            The user answered: ${userAnswer}

            First, provide a brief, encouraging 1-2 sentence feedback on the answer.
            Then, ask a new, simple question about a different part of the text.
            Remember:
            - New question must be under 30 words
            - Focus on basic comprehension
            - Use simple, clear language
            - Only ask about one concept at a time
            - The question should be answerable directly from the text`;

            const response = await claudeService.askQuestion(evaluationPrompt);

            if (response) {
                setQuestion(response);
            } else {
                setError('Failed to get next question.');
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

                    {loading && <p>Loading...</p>}
                    {error && <p className="error">{error}</p>}

                    <div className="question-container">
                        <p><strong>Question:</strong> {question}</p>
                        <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Your answer here..."
                            rows={4}
                        />
                    </div>

                    <div className="quiz-actions">
                        <button onClick={handleSubmitAnswer} disabled={loading || !userAnswer}>
                            Submit Answer
                        </button>
                        <button onClick={fetchQuestion} disabled={loading}>
                            Next Question
                        </button>
                    </div>

                    <div className="quiz-history">
                        <h3>Quiz History</h3>
                        {quizHistory.length > 0 ? (
                            <ul>
                                {quizHistory.map((entry, index) => (
                                    <li key={index}>
                                        <strong>Q:</strong> {entry.question}
                                        <br />
                                        <strong>A:</strong> {entry.answer}
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

                        .question-container {
                            margin-bottom: 20px;
                        }

                        .question-container p {
                            font-weight: bold;
                            color: #ffffff;
                        }

                        textarea {
                            width: 100%;
                            padding: 10px;
                            margin-top: 10px;
                            font-size: 16px;
                            border-radius: 4px;
                            border: 1px solid #444;
                            background: #333;
                            color: #fff;
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

                        .quiz-actions button:disabled {
                            background: #666;
                        }

                        .quiz-history {
                            margin-top: 30px;
                        }

                        .quiz-history ul {
                            list-style-type: none;
                            padding: 0;
                        }

                        .quiz-history li {
                            margin-bottom: 10px;
                            background: #3a3a3a;
                            padding: 10px;
                            border-radius: 4px;
                            border: 1px solid #555;
                        }

                        .error {
                            color: #ff4d4d;
                            font-weight: bold;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;