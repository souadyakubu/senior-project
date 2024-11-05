import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import books from './Books';
import './BookReader.css';

const BookReader = () => {
    const { bookTitle } = useParams();
    const book = books.find(b => b.title === decodeURIComponent(bookTitle));

    const [selectedChapter, setSelectedChapter] = useState('');
    const [userAnswers, setUserAnswers] = useState({});

    if (!book) {
        return <h2>Book not found</h2>;
    }

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

    return (
        <div className="book-reader">
            <h2>{book.title}</h2>
            <p><strong>Author:</strong> {book.author}</p>
            <iframe
                src={book.link}
                title={book.title}
                width="100%"
                height="600px"
                style={{ border: 'none' }}
            />

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
    );
};

export default BookReader;




// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import books from './Books';
// import './BookReader.css';

// const BookReader = () => {
//     const { bookTitle } = useParams();
//     const book = books.find(b => b.title === decodeURIComponent(bookTitle));
//     const [chapter, setChapter] = useState(1);
//     const [scriptureContent, setScriptureContent] = useState('');
//     const version = 'kjv'; // Default version, you can make this dynamic if needed

//     if (!book) {
//         return <h2>Book not found</h2>;
//     }

//     // Fetch the scripture content from CCEL API based on the selected chapter
//     const fetchScripture = async () => {
//         const passage = `${book.scriptureReference}_${chapter}`;
//         const url = `https://ccel.org/ajax/scripture?version=${version}&passage=${passage}`;

//         try {
//             const response = await fetch(url);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch scripture');
//             }
//             const html = await response.text();
//             setScriptureContent(html);
//         } catch (error) {
//             console.error("Error fetching scripture:", error);
//         }
//     };

//     // Fetch scripture content whenever the chapter changes
//     useEffect(() => {
//         fetchScripture();
//     }, [chapter]);

//     return (
//         <div className="book-reader">
//             <h2>{book.title}</h2>
//             <p><strong>Author:</strong> {book.author}</p>

//             {/* Chapter selection */}
//             <div>
//                 <label htmlFor="chapterSelect">Select a Chapter: </label>
//                 <select
//                     id="chapterSelect"
//                     value={chapter}
//                     onChange={(e) => setChapter(parseInt(e.target.value))}
//                 >
//                     {Array.from({ length: book.totalChapters }, (_, i) => (
//                         <option key={i + 1} value={i + 1}>
//                             Chapter {i + 1}
//                         </option>
//                     ))}
//                 </select>
//             </div>

//             {/* Display fetched scripture content */}
//             <div className="scripture-content" dangerouslySetInnerHTML={{ __html: scriptureContent }} />
//         </div>
//     );
// };

// export default BookReader;
