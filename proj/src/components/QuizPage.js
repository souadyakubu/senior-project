import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClaudeService from '../services/claudeService';

const QuizPage = () => {
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

            const response = await claudeService.askQuestion('Ask a question to the user.');

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

            const response = await claudeService.askQuestion(userAnswer);

            if (response) {
                setQuestion(response); // Get the next question from Claude
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

    useEffect(() => {
        fetchQuestion(); // Initial fetch when the component mounts
    }, []);

    return (
        <div className="quiz-container">
            <h1>Take the Quiz</h1>
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
    .quiz-container {
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
        background: #2c2c2c; /* Dark background */
        border-radius: 8px;
        color: #e0e0e0; /* Light text */
    }

    .question-container {
        margin-bottom: 20px;
    }

    .question-container p {
        font-weight: bold;
        color: #ffffff; /* White color for questions */
    }

    textarea {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        font-size: 16px;
        border-radius: 4px;
        border: 1px solid #444; /* Darker border */
        background: #333; /* Dark background for textarea */
        color: #fff; /* White text in textarea */
    }

    .quiz-actions button {
        margin: 10px;
        padding: 10px 20px;
        border-radius: 4px;
        border: none;
        background: #4CAF50; /* Green button color */
        color: white;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .quiz-actions button:disabled {
        background: #666; /* Disabled button color */
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
        background: #3a3a3a; /* Darker background for quiz history */
        padding: 10px;
        border-radius: 4px;
        border: 1px solid #555; /* Dark border */
    }

    .error {
        color: #ff4d4d; /* Light red error color */
        font-weight: bold;
    }
`}</style>

        </div>
    );
};

export default QuizPage;
