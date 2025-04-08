import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CCELSearch.css';

const CCELSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:3001/api/search-ccel', {
        params: { query: searchTerm }
      });
      
      setSearchResults(response.data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (book) => {
    try {
      await axios.post('http://localhost:3001/api/add-to-library', book);
      alert(`${book.title} has been added to your library!`);
    } catch (err) {
      console.error('Error adding book to library:', err);
      alert('Failed to add book to your library. Please try again.');
    }
  };

  return (
    <div className="ccel-search-container">
      <h2>Search Christian Classics Ethereal Library</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, author, or keyword..."
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>
      
      {error && <div className="search-error">{error}</div>}
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching CCEL database...</p>
        </div>
      )}
      
      {showResults && !loading && (
        <div className="search-results">
          <h3>Search Results ({searchResults.filter(book => 
            book.title && book.title !== "Read online" && book.urlName).length})</h3>
          {searchResults.filter(book => 
            book.title && book.title !== "Read online" && book.urlName).length === 0 ? (
            <p>No books found matching your search criteria.</p>
          ) : (
            <div className="results-grid">
              {searchResults
                .filter(book => book.title && book.title !== "Read online" && book.urlName)
                .map((book) => (
                  <div key={book.id} className="result-card">
                    <h4>{book.title}</h4>
                    <p><strong>Author:</strong> {book.author}</p>
                    <div className="result-actions">
                      <Link 
                        to={`/book/${encodeURIComponent(book.urlName)}`}
                        state={{ 
                          ccelBook: book,
                          fromSearch: true
                        }}
                        className="read-button"
                      >
                        Read Now
                      </Link>
                      <button 
                        onClick={() => handleAddToLibrary(book)}
                        className="add-button"
                      >
                        Add to Library
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CCELSearch;