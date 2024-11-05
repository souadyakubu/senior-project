import React, { useState } from "react";

const Quiz = ({ quizData }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);

    };

    return (
        <div>
            <h3>Quiz</h3>
            {quizData.map((q, index) => (
                <div key={index}>
                    <p>{q.question}</p>
                    {q.options.map((option, i) => (
                        <label key={i}>
                            <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                onChange={() => setAnswers({ ...answers, [index]: option })}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            ))}
            <button onClick={handleSubmit}>Submit Quiz</button>
            {submitted && <div>Check your answers...</div>}
        </div>
    );
};

export default Quiz;
