let cart = [];

// Function to store the cart of the both pages in local storage
// //so that the cart is the same on both pages and doesn't reset
// when going to the product page and back to the main page.
function loadCartFromStorage() {
  const stored = localStorage.getItem("cart");
  cart = stored ? JSON.parse(stored) : [];
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

loadCartFromStorage();

// Get ID from URL (?id=3)
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let currentProduct = null;

async function loadProduct() {
  try {
    const response = await fetch(`http://localhost:3000/products/${productId}`);
    product = await response.json();

    currentProduct = product;

    console.log(product);

    const container = document.getElementById("product-page-Detail");
    // Format release date nicely
    const inCart = cart.find((item) => item.id === product.id);
    const release = product.releaseDate
      ? new Date(product.releaseDate).toLocaleDateString("en-IE")
      : "Unknown";

    const html = String.raw;
    container.innerHTML = html`
      <div class="product-detail-layout">
        <div class="product-detail-image">
          <img src="${product.image}" alt="${product.title} cover" />
        </div>

        <div class="product-detail-info">
          <h1>${product.title}</h1>
          <p class="detail-artist">${product.artist}</p>

          <p class="detail-badge">
            Product Badge: <span>${product.badge}</span>
          </p>

          <p class="detail-genre">Product Genre: ${product.genre}</p>

          <p class="detail-price">
            Store price: €${Number(product.price).toFixed(2)}
          </p>

          <p class="detail-market-price">
            Market price (Discogs):
            ${product.marketPrice ? `€${product.marketPrice}` : "Not available"}
          </p>

          <p class="detail-release">Release date: ${release}</p>
        
          <button
            class="return-btn ${inCart ? "added" : ""}"
            id="btn-${product.id}"
            onclick="addToCartFromDetail()"
          >
            ${inCart ? "Added" : "Add to Cart"}
          </button>
          
        </div>
      </div>
    `;
    // Scroll to product detail after it renders
    setTimeout(() => {
      document.getElementById("product-page-Detail").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  } catch (error) {
    console.error("Error loading product:", error);
    document.getElementById("productDetail").textContent =
      "Sorry, this album could not be loaded.";
  }
}

// Called when clicking "Add to Cart" on the detail page
function addToCartFromDetail() {
  if (!currentProduct) return;

  // reload cart in case it changed elsewhere
  loadCartFromStorage();

  const exists = cart.find((item) => item.id === currentProduct.id);
  if (!exists) {
    cart.push({ ...currentProduct, qty: 1 });
    saveCart();
  }

  // Redirect back to index and ask it to open the cart
  window.location.href = "index.html?openCart=1";
}

function updateCart() {
  try {
    loadCartFromStorage();

    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cartCount").textContent = count;

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    document.getElementById("cartTotal").textContent = "€" + total.toFixed(2);

    const element = document.getElementById("cartItems");

    if (cart.length === 0) {
      const html = String.raw;
      element.innerHTML = html` <div class="cart-empty">
        <i
          class="ti ti-vinyl"
          aria-hidden="true"
          style="font-size:2.5rem;opacity:.3;color:var(--warm-gray)"
        ></i>
        <p>Your cart is empty</p>
      </div>`;
    } else {
      const html = String.raw;
      element.innerHTML = cart
        .map(
          (item) =>
            html`<div class="cart-item">
              <div class="cart-item-info">
                <p class="cart-item-title">${item.title}</p>
                <p class="cart-item-artist">${item.artist}</p>
                <p class="cart-item-price">
                  €${(item.price * item.qty).toFixed(2)}
                </p>
              </div>

              <div class="cart-item-controls">
                <label for="qty-${item.id}" class="qty-label">Qty:</label>
                <input
                  type="number"
                  id="qty-${item.id}"
                  class="qty-input"
                  min="1"
                  value="${item.qty}"
                  onchange="updateQty(${item.id}, this.value)"
                />
                <button
                  class="cart-item-remove"
                  onclick="removeFromCart(${item.id})"
                  aria-label="Remove ${item.title}"
                >
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            </div>`,
        )
        .join("");
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    showToast("Something went wrong while updating your cart.");
  }
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");

  if (!sidebar || !overlay) {
    console.warn("Cart elements not found on this page.");
    return;
  }

  sidebar.classList.toggle("open");
  overlay.classList.toggle("open");
}

function removeFromCart(productId) {
  // Remove the product from the cart by filtering it out
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  const btn = document.getElementById("btn-" + productId);

  if (btn) {
    // Update the button to indicate the product can be added again
    btn.textContent = "Add";
    // Remove the 'added' class to reset the button state
    btn.classList.remove("added");
  }
  updateCart();
  showToast('"' + currentProduct.title + '" removed from cart');
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  // Add the 'show' class to make the toast visible
  toast.classList.add("show");
  // Remove the 'show' class after 3 seconds
  setTimeout(() => toast.classList.remove("show"), 2200);
}

loadProduct();
updateCart();

document
  .getElementById("proceedToCheckoutBtn")
  .addEventListener("click", function () {
    // Check the global cart array that your script is already maintaining
    if (cart.length === 0) {
      alert("Your cart is empty! Add some vinyl records before checking out.");
      return; // Stops execution completely
    }

    // Only triggers if cart has items
    window.location.href = "checkout_page.html#checkout-page";
  });

function sendNewsletterSubscription() {
  // Finds the input field using the class name from your HTML
  const newsletterInput = document.querySelector(".newsletter-input");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clean up the text input value
  const emailValue = newsletterInput.value.trim();

  // Correct syntax: regexPattern.test(stringToTest)
  if (!emailPattern.test(emailValue)) {
    showToast("Please enter a valid email address.");
  } else {
    showToast("Thank you for subscribing to our newsletter!");
    newsletterInput.value = ""; // Clears the input field box on success
  }
}
