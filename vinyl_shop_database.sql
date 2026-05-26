CREATE DATABASE vinyl_store;
USE vinyl_store;
CREATE TABLE products (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  artist VARCHAR(255),
  genre VARCHAR(100),
  price DECIMAL(10,2)
);

INSERT INTO products (id, title, artist, genre, price) VALUES
(1,'Kind of Blue','Miles Davis','Jazz',27.99),
(2,'Blue Train','John Coltrane','Jazz',24.99),
(3,'Led Zeppelin IV','Led Zeppelin','Rock',32.99),
(4,'Rumours','Fleetwood Mac','Rock',29.99),
(5,'What''s Going On','Marvin Gaye','Soul',26.99),
(6,'I Never Loved a Man','Aretha Franklin','Soul',25.99),
(7,'Homework','Daft Punk','Electronic',34.99),
(8,'Selected Ambient Works','Aphex Twin','Electronic',31.99),
(9,'Goldberg Variations','Glenn Gould','Classical',23.99),
(10,'Abbey Road','The Beatles','Rock',35.99),
(11,'Innervisions','Stevie Wonder','Soul',28.99),
(12,'Elvis Presley','Elvis Presley','Rock & Roll',21.99),
(13,'The Number of the Beast','Iron Maiden','Metal',27.49);

UPDATE products
SET genre = 'Rock'
WHERE id = 12;

USE vinyl_store;

ALTER TABLE products
ADD COLUMN badge VARCHAR(255);

ALTER TABLE products ADD COLUMN image_url VARCHAR(500);

SELECT * FROM products;

UPDATE products
SET genre = 'Rock'
WHERE artist = 'Elvis Presley';

UPDATE products SET badge = 'Classic' WHERE id = 1;
UPDATE products SET badge = 'New'     WHERE id = 2;
UPDATE products SET badge = 'Hot'     WHERE id = 3;
UPDATE products SET badge = 'Limited' WHERE id = 4;
UPDATE products SET badge = 'Classic' WHERE id = 5;
UPDATE products SET badge = 'Hot'     WHERE id = 6;
UPDATE products SET badge = 'Limited' WHERE id = 7;
UPDATE products SET badge = 'Classic' WHERE id = 8;
UPDATE products SET badge = 'New'     WHERE id = 9;
UPDATE products SET badge = 'New'     WHERE id = 10;
UPDATE products SET badge = 'Hot'     WHERE id = 11;
UPDATE products SET badge = 'Limited' WHERE id = 12;

SELECT * FROM products;

SHOW CREATE TABLE products;

UPDATE products SET badge = 'TestBadge' WHERE id = 1;
SELECT id, badge FROM products WHERE id = 1;
DESCRIBE products;

UPDATE products SET badge = 'Classic' WHERE id = 1;
UPDATE products SET badge = 'New'     WHERE id = 2;
UPDATE products SET badge = 'Hot'     WHERE id = 3;
UPDATE products SET badge = 'Limited' WHERE id = 4;
UPDATE products SET badge = 'Classic' WHERE id = 5;
UPDATE products SET badge = 'Hot'     WHERE id = 6;
UPDATE products SET badge = 'Limited' WHERE id = 7;
UPDATE products SET badge = 'Classic' WHERE id = 8;
UPDATE products SET badge = 'New'     WHERE id = 9;
UPDATE products SET badge = 'New'     WHERE id = 10;
UPDATE products SET badge = 'Hot'     WHERE id = 11;
UPDATE products SET badge = 'Limited' WHERE id = 12;
UPDATE products SET badge = 'Classic' WHERE id = 13;

SELECT * FROM products;

ALTER TABLE products
ADD COLUMN releaseDate VARCHAR(255);
DESCRIBE products;

SELECT id, title, genre, releaseDate FROM products WHERE id = 1;

UPDATE products
SET price = 23.49
WHERE id = 13;

UPDATE products
SET price = 13.59
WHERE id = 10;

UPDATE products
SET price = 9.50
WHERE id = 9;

UPDATE products
SET price = 25.00
WHERE id = 7;

UPDATE products
SET price = 15.99
WHERE id = 6;

UPDATE products
SET price = 9.59
WHERE id = 2;

UPDATE products
SET price = 12.29
WHERE id = 2;

