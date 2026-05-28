require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
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
  console.log("MySQL connected");
});

// Apple Music API call for album data
async function getAppleAlbumData(artist, album) {
  try {
    const query = encodeURIComponent(`${artist} ${album}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Apple Music API error:", response.status, response.statusText);
      return {
        image: "/images/fallback-cover.png",
        primaryGenreName: null, // Fixed key name
        releaseDate: null
      };
    }

    const data = await response.json();
    console.log("Apple API response for:", artist, album, data);

    if (data.results.length === 0) {
      return {
        image: "/images/fallback-cover.png",
        primaryGenreName: null, // Fixed key name
        releaseDate: null
      };
    }
  
    const result = data.results[0];

    return {
      image: result.artworkUrl100.replace("100x100", "600x600"),
      primaryGenreName: result.primaryGenreName || null,
      releaseDate: result.releaseDate || null
    };

  } catch (error) {
    console.error("Error fetching Apple album data:", error);
    return {
      image: "/images/fallback-cover.png",
      primaryGenreName: null,
      releaseDate: null
    };
  }
}

// Discogs call for market price data
async function getDiscogsMarketPrice(artist, album) {
  try {
    const query = encodeURIComponent(`${artist} ${album}`);
    const searchUrl = `https://api.discogs.com/database/search?q=${query}&type=release`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent": "VinylShop/1.0 +https://yourwebsite.com",
        "Authorization": `Discogs token=${process.env.DISCOGS_TOKEN}`
      }
    });

    if (!searchResponse.ok) {
      console.error("Discogs API error:", searchResponse.status, searchResponse.statusText);
      return { marketPrice: null };
    }

    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      console.log("No Discogs results for:", artist, album);
      return { marketPrice: null };
    }

    const release = searchData.results[0];
    const releaseId = release.id;
    const masterId = release.master_id;
    const targetIds = [releaseId, masterId].filter(Boolean);

    let marketPrice = null;

    for (const id of targetIds) {
      const statsUrl = `https://api.discogs.com/marketplace/stats/${id}`;
      console.log("💰 Discogs STATS URL:", statsUrl);

      const statsResponse = await fetch(statsUrl, {
        headers: {
          "User-Agent": "VinylShop/1.0 +https://yourwebsite.com",
          "Authorization": `Discogs token=${process.env.DISCOGS_TOKEN}`
        }
      });

      if (!statsResponse.ok) {
        console.warn(`Discogs stats error for ID ${id}:`, statsResponse.status, statsResponse.statusText);
        continue;
      }

      const statsData = await statsResponse.json();
      console.log("💰 Discogs STATS DATA:", statsData);

      marketPrice = statsData.median_price?.value
        ?? statsData.lowest_price?.value
        ?? null;

      if (marketPrice) break;
    }

    console.log("✅ Market price for:", artist, album, { marketPrice });
    return { marketPrice };

  } catch (error) {
    console.error("Error fetching Discogs market price:", error);
    return { marketPrice: null };
  }
}

// Routes
// GETTING ALL PRODUCTS
app.get('/products', async (req, res) => {
  try {
    const [productsFromDB] = await db.promise().query("SELECT * FROM products");

    const completeProducts = await Promise.all(
      productsFromDB.map(async (product) => {
        if (product.image_url) {
          return { ...product, image: product.image_url };
        }

        // Fetch data object from Apple API
        const appleData = await getAppleAlbumData(product.artist, product.title);

        // ✅ FIXED: Save ONLY the image string to the database
        await db.promise().query(
          "UPDATE products SET image_url = ? WHERE id = ?", 
          [appleData.image, product.id]
        );

        return { ...product, image: appleData.image };
      })
    );

    res.json(completeProducts);

  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

// GETTING A SINGLE PRODUCT BY ID
app.get("/products/:id", async(req, res) => {
  try {
    const [productsFromDB] = await db.promise().query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );

    const product = productsFromDB[0];
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let image = product.image_url;
    let genre = product.genre;
    let releaseDate = product.releaseDate;

    if (!image || !genre || !releaseDate) {
      const appleData = await getAppleAlbumData(product.artist, product.title);

      if (!image && appleData.image) {
        image = appleData.image;
        await db.promise().query(
          "UPDATE products SET image_url = ? WHERE id = ?",
          [image, product.id]
        );
      }

      if (!genre && appleData.primaryGenreName) {
        genre = appleData.primaryGenreName;
        await db.promise().query(
          "UPDATE products SET genre = ? WHERE id = ?",
          [genre, product.id]
        );
      }

      if (!releaseDate && appleData.releaseDate) {
        releaseDate = appleData.releaseDate;
        await db.promise().query(
          "UPDATE products SET releaseDate = ? WHERE id = ?",
          [releaseDate, product.id]
        );
      }
    }

    const marketPrice = await getDiscogsMarketPrice(product.artist, product.title);

    const fullProduct = {
      ...product,
      image,
      genre,
      releaseDate,
      marketPrice: marketPrice.marketPrice
    };

    res.json(fullProduct);

  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to load product" });
  }
});

// CHECKOUT FORM SUBMISSION - POST REQUEST
app.post('/api/checkout', (req, res) => {
  // Destructure the payload properties coming from the frontend (req.body)
const {first_name,
last_name,
email,
phone,
street_address,
complement,
city,
postcode,
country
} = req.body;

// Basic validation fallback
if (!first_name || !last_name || !email || !street_address) {
    return res.status(400).json({ error: "Missing required checkout fields." });
  }

  
const sqlQuery = `
    INSERT INTO checkout_submissions 
    (first_name, last_name, email, phone, street_address, complement, city, postcode, country) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

const values = [
    first_name, 
    last_name, 
    email, 
    phone || null, // default to null if empty, 
    street_address, 
    complement || null, // default to null if empty
    city, 
    postcode, 
    country
  ];

// Execute the MySQL query using your connection instance ('db')
  db.query(sqlQuery, values, (error, results) => {
    if (error) {
      console.error("MySQL Database Error:", error);
      return res.status(500).json({ error: "Failed to store submission data inside database." });
    }

    // Respond back to frontend that insertion succeeded
    return res.status(201).json({ 
      message: "Order data stored successfully!", 
      submissionId: results.insertId 
    });
});
});

app.listen(3000, () => console.log("Server running on port 3000"));