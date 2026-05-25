// 1. Get ID from URL (?id=3)
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

async function loadProduct() {
  try {
    const response = await fetch(`http://localhost:3000/products/${productId}`);
    const product = await response.json();

    console.log(product);

    const container = document.getElementById("product-page-Detail");
    // Format release date nicely
    
    const release = product.releaseDate
      ? new Date(product.releaseDate).toLocaleDateString()
      : "Unknown";

      container.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-detail-image">
          <img src="${product.image}" alt="${product.title} cover">
        </div>
        <div class="product-detail-info">
          <h1>${product.title}</h1>
          <p class="detail-artist">${product.artist}</p>
             
          <p class="detail-badge"> Product Badge:  <span>${product.badge}</span>
          </p>

          <p class="detail-genre">Product Genre: ${product.genre}</p>

          <p class="detail-price">
            Store price: €${Number(product.price).toFixed(2)}
          </p>

          <p class="detail-market-price">
            Market price (Apple): ${
              product.marketPrice ? `€${product.marketPrice}` : "Not available"
            }
          </p>

          <p class="detail-release">
            Release date: ${release}
          </p>

          <button class="return-btn" onclick="window.location.href='index.html'">
  <i class="ti ti-arrow-left"></i> Return to main page
</button>
        </div>
      </div>
    `;
    } catch (error) {
    console.error("Error loading product:", error);
    document.getElementById("productDetail").textContent =
      "Sorry, this album could not be loaded.";
  }
}

loadProduct();