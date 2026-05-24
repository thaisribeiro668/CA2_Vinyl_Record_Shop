const express = require('express');
const mysql = require('mysql2');
//Cross‑Origin Resource Sharing: Allows other origins (like the frontend) to access this API, removing the browser's block.
const cors = require("cors");

const app = express();
app.use(cors());
// Whenever a request comes in with a JSON body, automatically parse it into a JavaScript object.
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "amzl2021@25!",
  database: "vinyl_store"
});

db.connect(err => {
  if (err) throw err;
  // if not
  console.log("MySQL connected");
});

// Routes
// GETTING ALL PRODUCTS
app.get('/products', (req, res) => {
 db.query("SELECT * FROM products", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// GETTING A SINGLE PRODUCT BY ID
app.get("/products/:id", (req, res) => {
  db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, results) => {
    if (err) throw err;
    res.json(results[0]);
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
