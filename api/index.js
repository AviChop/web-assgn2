// Import required modules
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const fs = require('fs');

// Create an Express app instance
const app = express();
const port = process.env.PORT || 3002;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Register Handlebars helpers when setting up the engine
app.engine('.hbs', engine({
  extname: '.hbs',
  helpers: {
    // Existing helper (if any)
    hasMetascore: function(metascore, options) {
      if (metascore && metascore.trim() !== '' && metascore.toUpperCase() !== 'N/A') {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },

    // New helper for Step 9
    highlightIfNoMetascore: function(metascore, options) {
      if (!metascore || metascore.trim() === '' || metascore.toUpperCase() === 'N/A') {
        return options.fn(this); // condition TRUE: highlight
      } else {
        return options.inverse(this); // condition FALSE: no highlight
      }
    }
  }
}));


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Load JSON data
const dataPath = path.join(__dirname, 'movies.json');
let movies = [];

try {
  const jsonData = fs.readFileSync(dataPath, 'utf-8');
  movies = JSON.parse(jsonData);
} catch (err) {
  console.error('Failed to load movies data:', err);
}

// ========== ROUTES ========== //

// Home
app.get('/', (req, res) => {
  res.render('index', { title: 'Home Page' });
});

// Data summary
app.get('/data', (req, res) => {
  res.render('data', { title: 'All Movies', movies }); // passing `movies` instead of `data` for clarity
});

// Show movie by index
app.get('/data/movie/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  
  // Check if index is valid
  if (isNaN(index) || index < 0 || index >= movies.length) {
    return res.status(404).render('error', { title: 'Error', message: 'Movie not found' });
  }

  const movie = movies[index];

  res.render('movie', { title: movie.Title, movie });
});


// Search by ID
app.get('/search/id', (req, res) => {
  res.render('searchById', { title: 'Search by Movie ID' });
});

app.get('/search/id/result', (req, res) => {
  const movieId = req.query.movie_id;
  const foundMovie = movies.find(m => String(m.Movie_ID) === String(movieId));

  if (foundMovie) {
    res.render('resultById', { title: 'Search Result', movie: foundMovie });
  } else {
    res.status(404).render('error', { title: 'Error', message: `No movie found with ID "${movieId}"` });
  }
});

// Search by Title
app.get('/search/title', (req, res) => {
  res.render('searchByTitle', { title: 'Search Movie by Title' });
});

app.get('/search/title/result', (req, res) => {
  const searchTitle = req.query.movie_title;

  if (!searchTitle) {
    return res.status(400).render('error', {
      title: 'Error',
      message: 'Movie title is required.'
    });
  }

  const matches = movies.filter(m =>
    m.Title && m.Title.toLowerCase().includes(searchTitle.toLowerCase())
  );

  if (matches.length > 0) {
    res.render('resultByTitle', {
      title: 'Search Results',
      results: matches,
      searchTitle
    });
  } else {
    res.status(404).render('error', {
      title: 'No Results',
      message: `No movies found with title including "${searchTitle}".`
    });
  }
});

// STEP 7
app.get('/allData', (req, res) => {
  res.render('allData', {
    title: 'All Movies Data',
    movies // Pass all movies array to the view
  });
});

// STEP 8 - filtered by metascore (use helper in view)
app.get('/allDataFiltered', (req, res) => {
  res.render('allDataFiltered', {
    title: 'All Movies (Filtered by Metascore)',
    movies
  });
});

//STEP 9
app.get('/allDataHighlight', (req, res) => {
  res.render('allDataHighlight', {
    title: 'All Movies with Highlighted Metascore',
    movies
  });
});


// Catch-all
app.get('*', (req, res) => {
  res.status(404).render('error', { title: '404', message: 'Wrong Route' });
});

// Start the server
module.exports = app;