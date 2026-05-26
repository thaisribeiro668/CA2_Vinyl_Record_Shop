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
        marketPrice: null,
        releaseDate: null
      };
    }

  const data = await response.json();
  console.log("Apple API response for:", artist, album, data);

  if (data.results.length === 0) {
    return {
        image: "/images/fallback-cover.png",
        marketPrice: null,
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
      // ✅ Use marketplace/stats instead of price_suggestions
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

      // lowest_price is the most useful for a "market price" indicator
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
// GETTING ALL PRODUCTS - response will be sent to loadProducts() on script.js
app.get('/products', async (req, res) => {
  try {
    // Use promise-based query to fetch products from the database: without promise(), await simply won’t work.
    const [productsFromDB] = await db.promise().query("SELECT * FROM products");

    const completeProducts = await Promise.all(
      productsFromDB.map(async (product) => {
        // If cached, use database image URL
        if (product.image_url) {
          return { ...product, image: product.image_url };
        }

        // If not cached, fetch image from Apple API
        const cover = await getAppleAlbumData(product.artist, product.title);

        // Save the image to the database for next time
        await db.promise().query(
          "UPDATE products SET image_url = ? WHERE id = ?", 
          [cover, product.id]);

          return { ...product, image: cover };
      }));

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
    // Keep your variable names
    let image = product.image_url;
    let genre = product.genre;
    let releaseDate = product.releaseDate;

    // Fetch Apple API only if needed
    if (!image || !genre || !releaseDate) {
      const appleData = await getAppleAlbumData(product.artist, product.title);

 // Save image if missing
      if (!image && appleData.image) {
        image = appleData.image;
        await db.promise().query(
          "UPDATE products SET image_url = ? WHERE id = ?",
          [image, product.id]
        );
      }

      // Save genre if missing
      if (!genre && appleData.primaryGenreName) {
        genre = appleData.primaryGenreName;
        await db.promise().query(
          "UPDATE products SET genre = ? WHERE id = ?",
          [genre, product.id]
        );
      }

      // Save release date if missing
      if (!releaseDate && appleData.releaseDate) {
        releaseDate = appleData.releaseDate;
        await db.promise().query(
          "UPDATE products SET releaseDate = ? WHERE id = ?",
          [releaseDate, product.id]
        );
      }
    }

    // Fetch Discogs market price
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

app.listen(3000, () => console.log("Server running on port 3000"));
