
import React from 'react';
import './BookCard.css';

const BookCard = ({ book }) => {
    return (
        <div className="book-card">
            <img src={book.cover} alt={book.title} />
            <p>{book.title}</p>
        </div>
    );
};

export default BookCard;



