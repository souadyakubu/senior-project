import React, { useState, useEffect } from "react";
import { saveBookProgress } from './services/firebase';
import { db } from './services/firebase';
import { getDocs, collection } from "firebase/firestore";

const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapter, setChapter] = useState(1);
    const [page, setPage] = useState(1);


    useEffect(() => {
        const fetchBooks = async () => {
            const bookCollection = collection(db, "books");
            const bookSnapshot = await getDocs(bookCollection);
            const bookList = bookSnapshot.docs.map(doc => doc.data());
            setBooks(bookList);
        };

        fetchBooks();
    }, []);

    // Search books
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const handleBookSelect = (book) => {
        setSelectedBook(book);
        setChapter(1); // Reset chapter to 1
        setPage(1); // Reset page to 1
    };


    const handleSaveProgress = async () => {
        const userId = "user123";
        const bookId = selectedBook.id;
        await saveBookProgress(userId, bookId, chapter, page);
        alert("Progress saved!");
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-6">Welcome to Your Christian Library</h1>


            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search for a book..."
                    className="p-2 border border-gray-300 rounded w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>


            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Books Available</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBooks.map((book) => (
                        <div
                            key={book.id}
                            className="cursor-pointer p-4 border border-gray-300 rounded shadow-md hover:bg-gray-100"
                            onClick={() => handleBookSelect(book)}
                        >
                            <h3 className="font-bold">{book.title}</h3>
                            <p>{book.author}</p>
                        </div>
                    ))}
                </div>
            </div>


            {selectedBook && (
                <div>
                    <h2 className="text-2xl font-semibold mb-4">{selectedBook.title}</h2>
                    <div className="mb-4">
                        <h3 className="text-xl">Table of Contents</h3>
                        <ul className="list-disc pl-6">
                            {selectedBook.chapters.map((chapterTitle, index) => (
                                <li
                                    key={index}
                                    className="cursor-pointer text-blue-600"
                                    onClick={() => setChapter(index + 1)}
                                >
                                    {chapterTitle}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xl">Chapter {chapter}</h3>
                        <p>{selectedBook.chapters[chapter - 1].content}</p>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            className="py-2 px-4 bg-blue-600 text-white rounded"
                        >
                            Previous Page
                        </button>
                        <p>Page {page}</p>
                        <button
                            onClick={() => setPage(page + 1)}
                            className="py-2 px-4 bg-blue-600 text-white rounded"
                        >
                            Next Page
                        </button>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleSaveProgress}
                            className="py-2 px-4 bg-green-600 text-white rounded"
                        >
                            Save Progress
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
