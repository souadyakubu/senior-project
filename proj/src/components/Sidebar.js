import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import books from './Books';


const Sidebar = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleSearch = (event) => {
        const term = event.target.value;
        setSearchTerm(term);

        const filteredBooks = books.filter(book =>
            book.title.toLowerCase().includes(term.toLowerCase()) ||
            book.author.toLowerCase().includes(term.toLowerCase())
        );

        setSearchResults(filteredBooks);
    };

    return (
        <div className="sidebar">
            <input
                type="text"
                className="search"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearch}
            />
            {searchTerm && (
                <div className="search-results">
                    {searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map((book, index) => (
                                <li key={index} onClick={() => handleNavigation(`/book/${book.urlName}`)}>
                                    {book.title} by {book.author}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No results found</p>
                    )}
                </div>
            )}
            <nav>
                <ul>
                    <li onClick={() => handleNavigation('/')}><i className="fas fa-home"></i> Home</li>
                    <li><i className="fas fa-book"></i> Book Store</li>
                    <li><i className="fas fa-headphones"></i> Audiobook Store</li>
                    <li><i className="fas fa-book-open"></i> All Books</li>
                    <li><i className="fas fa-check"></i> Finished</li>
                    <li><i className="fas fa-bookmark"></i> Want to Read</li>
                </ul>
            </nav>
        </div>
    );
};
export default Sidebar;