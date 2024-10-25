
import React from 'react';
import { Link } from 'react-router-dom';
import './BookSection.css';

const BookSection = ({ title, books }) => {
    return (
        <div className="book-section">
            <h2 className="collection-title">{title}</h2>
            <div className="book-list">
                {books.map((book, index) => (
                    <div className="book-item" key={index}>
                        {book.cover && <img src={book.cover} alt={book.title} />}
                        <p className="book-title">
                            <Link to={`/book/${encodeURIComponent(book.title)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {book.title}
                            </Link>
                        </p>
                        <p className="book-author">by {book.author}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookSection;
