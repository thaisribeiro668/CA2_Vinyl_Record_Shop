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


UPDATE products
SET genre = 'Rock'
WHERE artist = 'Elvis Presley';
