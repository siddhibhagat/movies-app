import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const baseURL = process.env.REACT_APP_BASE_URL || `http://localhost:4000`;
const API_URL = `${baseURL}/api/movies/search`; // Replace with your backend API URL
// const API_URL = `http://localhost:4000/api/movies/search`; // Replace with your backend API URL
const fallbackImage = "https://dummyimage.com/200x300/ccc/000.png&text=No+Poster";

const App = () => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const moviesPerPage = 10;

  useEffect(() => {
    fetchMovies(page, searchTerm);
  }, [page, searchTerm]);

  const fetchMovies = async (page, searchTerm) => {
    try {
      const response = await axios.get(API_URL, {
        params: { page, limit: moviesPerPage, term: searchTerm }
      });
      setMovies(response.data.data);
      setTotalPages(response.data.data.length !== 0 ? response.data.totalPages : 1); // totalPages should not be less than 1
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="app">
      <h1>🎬 Movie Explorer</h1>
      <input
        type="text"
        placeholder="Search movies..."
        className="search-input"
        value={searchTerm}
        onChange={handleSearch}
      />

      <div className="movie-container">
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div key={movie.imdbID} className="movie-card">
              <img src={movie.poster !== 'N/A' && movie.poster ? movie.poster : fallbackImage} alt={movie.title} className="movie-poster" />
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                <p className="movie-director"><strong>Director:</strong> {movie.director}</p>
                <p className="movie-plot">{movie.plot}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No movies found</p>
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default App;
