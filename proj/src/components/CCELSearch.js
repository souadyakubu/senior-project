import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CCELSearch.css';

const CCELSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        console.log('Checking CCEL API status...');
        const response = await axios.get('http://localhost:3001/api/ccel-status');
        
        // Check if we have a sphinx status or similar structure
        if (response.data && response.data.raw && response.data.raw.sphinx) {
          const allServicesUp = Object.values(response.data.raw)
            .every(service => service.up === true);
          
          setApiStatus({ 
            status: allServicesUp ? 'ok' : 'partial',
            message: 'CCEL API connected' 
          });
          console.log('API Status determined from services:', allServicesUp ? 'OK' : 'Partial');
          setUsingFallback(false);
        } else {
          setApiStatus(response.data);
          setUsingFallback(response.data.status !== 'ok');
        }
        
        console.log('API Status Response:', response.data);
      } catch (err) {
        console.error('Error checking API status:', err);
        setApiStatus({ status: 'error', message: 'Could not connect to CCEL API' });
        setUsingFallback(true);
        console.log('Will use fallback scraping search due to API connection error');
      }
    };
    
    checkApiStatus();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Searching for:', searchTerm);
      const response = await axios.get('http://localhost:3001/api/search-ccel', {
        params: { query: searchTerm }
      });
      
      console.log('Search response:', response.data);
      
      // Ensure we always have a valid array of results
      const results = response.data.results || [];
      
      // Debug log to check what we're receiving
      console.log(`Received ${results.length} results:`, results);
      
      // Filter out any results without title or ID
      const validResults = results.filter(book => 
        (book.title && book.title !== "Unknown Title") || 
        (book.id && book.id !== "")
      );
      
      console.log(`After filtering, ${validResults.length} valid results remain`);
      
      setSearchResults(validResults);
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
      console.log('Adding book to library:', book);
      await axios.post('http://localhost:3001/api/add-to-library', book);
      alert(`${book.title} has been added to your library!`);
    } catch (err) {
      console.error('Error adding book to library:', err);
      alert('Failed to add book to your library. Please try again.');
    }
  };

  // Render a single book card with proper error checking for missing properties
  const renderBookCard = (book, index) => {
    // Ensure book has at least a title and id
    const title = book.title || "Unknown Title";
    const author = book.author || "Unknown Author";
    const id = book.id || `result-${index}`;
    const hasLink = book.link && book.urlName;

    return (
      <div key={id} className="result-card">
        <h4>{title}</h4>
        <p><strong>Author:</strong> {author}</p>
        {book.summary && (
          <p className="book-summary">
            {book.summary.length > 100 
              ? book.summary.substring(0, 100) + '...' 
              : book.summary}
          </p>
        )}
        <div className="result-actions">
          {hasLink ? (
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
          ) : (
            <span className="disabled-button">Read Not Available</span>
          )}
          <button 
            onClick={() => handleAddToLibrary(book)}
            className="add-button"
          >
            Add to Library
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="ccel-search-container">
      <h2>Search Christian Classics Ethereal Library</h2>
      
      {apiStatus && (
        <div className={`api-status ${apiStatus.status === 'ok' ? 'status-ok' : (apiStatus.status === 'partial' ? 'status-partial' : 'status-error')}`}>
          {usingFallback ? (
            <>API Status: Error connecting to CCEL API (Using fallback search)</>
          ) : (
            <>API Status: {apiStatus.status === 'ok' ? 'Connected' : (apiStatus.status === 'partial' ? 'Partially Connected' : 'Error connecting to CCEL API')}</>
          )}
        </div>
      )}
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, author, or keyword..."
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <div className="search-error">{error}</div>}
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching {usingFallback ? 'CCEL website' : 'CCEL database'}...</p>
        </div>
      )}
      
      {showResults && !loading && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          
          {searchResults.length === 0 ? (
            <p>No books found matching your search criteria.</p>
          ) : (
            <div className="results-grid">
              {searchResults.map((book, index) => renderBookCard(book, index))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CCELSearch;