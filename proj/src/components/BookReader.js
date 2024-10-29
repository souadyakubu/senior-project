import React from 'react';
import { useParams } from 'react-router-dom';
import books from './Books';

const BookReader = () => {
    const { bookTitle } = useParams();
    const book = books.find(b => b.title === decodeURIComponent(bookTitle));

    if (!book) {
        return <h2>Book not found</h2>;
    }

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
        </div>
    );
};

export default BookReader;
