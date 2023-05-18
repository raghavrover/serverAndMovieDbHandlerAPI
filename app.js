const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await app.listen(3000, () => {
      console.log("Server Started On 3000...");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeServerAndDB();

//GET all movies API
app.get("/movies/", async (req, res) => {
  const getAllMoviesQuery = `
    SELECT movie_name
    FROM movie
    ORDER BY movie_id ASC;`;
  const moviesArray = await db.all(getAllMoviesQuery);
  const newMoviesArray = moviesArray.map((dbObject) => {
    return { movieName: dbObject.movie_name };
  });
  res.send(newMoviesArray);
});

//POST a movie data API
app.post("/movies/", async (req, res) => {
  const movieDetails = req.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const createMovieDetailsQuery = `
    INSERT INTO movie(director_id, movie_name, lead_actor)
    VALUES ('${directorId}',
     '${movieName}',
      '${leadActor}')
    ;`;
  await db.run(createMovieDetailsQuery);
  res.send("Movie Successfully Added");
});

//GET movie details API
app.get("/movies/:movieId/", async (req, res) => {
  try {
    const { movieId } = req.params;
    // there is a problem in the SQL query when filtered with movie_name
    const getMovieDetailsQuery = `
    SELECT *
    FROM movie
    WHERE movie_id = ${movieId}; 
    `;

    const movieDetails = await db.get(getMovieDetailsQuery);
    const convertDbObjectToResponseObject = (dbObject) => {
      return {
        movieId: dbObject.movie_id,
        directorId: dbObject.director_id,
        movieName: dbObject.movie_name,
        leadActor: dbObject.lead_actor,
      };
    };

    const newMovieDetails = convertDbObjectToResponseObject(movieDetails);
    res.send(newMovieDetails);
  } catch (e) {
    console.log(`${e.message}`);
  }
});

//PUT movie details API
app.put("/movies/:movieId/", async (req, res) => {
  const { movieId } = req.params;
  const bodyDetails = req.body;
  const { directorId, movieName, leadActor } = bodyDetails;
  const updateMovieDetailsQuery = `
UPDATE movie
SET 
director_id = '${directorId}',
movie_name = '${movieName}',
lead_actor = '${leadActor}'
`;
  await db.run(updateMovieDetailsQuery);
  res.send("Movie Details Updated");
});

//DELETE movie API
app.delete("/movies/:movieId/", async (req, res) => {
  const { movieId } = req.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id='${movieId}'`;
  const newDB = await db.run(deleteMovieQuery);
  console.log(`movie id:${newDB.lastID}`);
  res.send("Movie Removed");
});

//GET directors details API
app.get("/directors/", async (req, res) => {
  const getAllDirectorsQuery = `
    SELECT *
    FROM director`;
  const directorsArray = await db.all(getAllDirectorsQuery);
  const newDirectorsArray = directorsArray.map((dbObject) => {
    return {
      directorId: dbObject.director_id,
      directorName: dbObject.director_name,
    };
  });
  res.send(newDirectorsArray);
});

//GET director movies API
app.get("/directors/:directorId/movies/", async (req, res) => {
  const { directorId } = req.params;
  const getAllMoviesOfDirectorQuery = `
    SELECT movie_name
    FROM movie
    WHERE director_id = '${directorId}';
   `;
  const directorMoviesArray = await db.all(getAllMoviesOfDirectorQuery);
  const newDirectorMoviesArray = directorMoviesArray.map((dbObject) => {
    return {
      movieName: dbObject.movie_name,
    };
  });
  res.send(newDirectorMoviesArray);
});

module.exports = app;
