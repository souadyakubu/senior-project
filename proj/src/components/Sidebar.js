import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <input type="text" className="search" placeholder="Search" />
            <nav>
                <ul>
                    <li><i className="fas fa-home"></i> Home</li>
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
