// src/components/Library.js
import React from 'react';

const Library = ({ books, onSelectBook }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map((book) => (
                <div
                    key={book.id}
                    className="border p-4 rounded-lg cursor-pointer"
                    onClick={() => onSelectBook(book)}
                >
                    <img src={book.cover} alt={book.title} className="h-40 w-full object-cover" />
                    <h3 className="mt-4 font-bold text-lg">{book.title}</h3>
                    <p className="text-gray-500">{book.author}</p>
                </div>
            ))}
        </div>
    );
};

export default Library;
