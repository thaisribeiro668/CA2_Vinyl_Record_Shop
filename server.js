// Dotenv load environment variables from a .env file, 
// which is used to keep sensitive information like passwords
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
//Cross‑Origin Resource Sharing: Allows other origins (like the frontend) to access this API, removing the browser's block.
const cors = require("cors");
const app = express();
app.use(cors());
// Whenever a request comes in with a JSON body, automatically parse it into a JavaScript object.
app.use(express.json());

// Allows the access to static files from the "public" directory, like images for example
app.use(express.static("public"));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  // if not
  console.log("MySQL connected");
});

// Apple Music API call for album covers
async function getAppleAlbumCover(artist, album) {
  try {
  const query = encodeURIComponent(`${artist} ${album}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    console.error("Apple Music API error:", response.status, response.statusText);
    return null;
}

  const data = await response.json();
  console.log("Apple API response for:", artist, album, data);

  if (data.results.length > 0) {
    // Apple returns 100x100 by default — replace with 600x600
    return data.results[0].artworkUrl100.replace('100x100', '600x600');
    // return data.results[0].price;
  }

  // No results found → fallback
  return "/images/fallback-cover.png";
} catch (error) {
console.error("Error fetching Apple album cover:", error);
    return "/images/fallback-cover.png";
}
}

// Routes
// GETTING ALL PRODUCTS - response will be sent to loadProducts() on script.js
app.get('/products', async (req, res) => {
  try {
    // Use promise-based query to fetch products from the database: without promise(), await simply won’t work.
    const [rows] = await db.promise().query("SELECT * FROM products");

    const enriched = await Promise.all(
      rows.map(async (product) => {
        // If cached, use database image URL
        if (product.image_url) {
          return { ...product, image: product.image_url };
        }

        // If not cached, fetch image from Apple API
        const cover = await getAppleAlbumCover(product.artist, product.title);

        // Save the image to the database for next time
        await db.promise().query(
          "UPDATE products SET image_url = ? WHERE id = ?", 
          [cover, product.id]);

          return { ...product, image: cover };
      }));

    res.json(enriched);
    
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

// GETTING A SINGLE PRODUCT BY ID
app.get("/products/:id", (req, res) => {
  db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, results) => {
    if (err) throw err;
    res.json(results[0]);
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
