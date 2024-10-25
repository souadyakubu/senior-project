
import React, { useState } from "react";

const SearchFeature = ({ searchTexts }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async () => {
        const result = await searchTexts(query);
        setResults(result);
    };

    return (
        <div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search texts"
            />
            <button onClick={handleSearch}>Search</button>
            {results.length > 0 && (
                <ul>
                    {results.map((res, index) => (
                        <li key={index}>{res}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchFeature;
