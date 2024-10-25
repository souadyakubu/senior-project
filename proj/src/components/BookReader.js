// src/components/BookReader.js
import React from 'react';
import { useParams } from 'react-router-dom';
import books from './Books'; // Adjust the import path as needed

const BookReader = () => {
    const { bookTitle } = useParams(); // Get the book title from the URL parameters
    const book = books.find(b => b.title === decodeURIComponent(bookTitle)); // Find the selected book

    if (!book) {
        return <h2>Book not found</h2>; // Handle case when book is not found
    }

    return (
        <div className="book-reader">
            <h2>{book.title}</h2>
            <p><strong>Author:</strong> {book.author}</p>
            <iframe
                src={book.link} // Use the link to display the book content
                title={book.title}
                width="100%"
                height="600px"
                style={{ border: 'none' }}
            />
        </div>
    );
};

export default BookReader;
