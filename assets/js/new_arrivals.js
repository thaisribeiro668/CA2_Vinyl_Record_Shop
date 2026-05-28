let products = [];
let cart = [];
let badge = "New";
let currentSearch = "";

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

async function loadProducts() {
  try {
    const response = await fetch("http://localhost:3000/products");
    products = await response.json();
    displayProducts();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

loadProducts();

function displayProducts() {
  try {
    const grid = document.getElementById("new-arrivals-grid");
    //Variable to track how many products are visible after filtering
    let visible = 0;
    // For each product, check if it matches the current genre and search term
    grid.innerHTML = products
      .map((product) => {
        // Determine if the product should be shown based on genre and search filters
        const show =
          product.badge === "New" &&
          (product.title.toLowerCase().includes(currentSearch) ||
            product.artist.toLowerCase().includes(currentSearch));
        // If the product matches the filters, increment the visible count
        if (show) visible++;
        // Check if the product is already in the cart
        const inCart = cart.find((item) => item.id === product.id);
        const html = String.raw; // putrtin this to prettier be able to indent the html below
        return html`
          <div
            class="product-card${show ? "" : " hidden"}"
            id="card-${product.id}"
          >
            <div class="card-img">
              <a href="product.html?id=${product.id}">
                <img src="${product.image}" alt="${product.title} cover" />
                <span class="hover-hint">Click for details</span>
              </a>
            </div>

            <div class="card-body">
              <p class="card-genre">${product.genre}</p>
              <h3 class="card-title">${product.title}</h3>
              <p class="card-artist">${product.artist}</p>

              <div class="card-footer">
                <span class="card-price"
                  >€${Number(product.price).toFixed(2)}</span
                >

                <button
                  class="add-btn${inCart ? " added" : ""}"
                  id="btn-${product.id}"
                  onclick="addToCart(${product.id})"
                >
                  ${inCart ? "Added" : "Add"}
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
    // ⭐ Scroll AFTER rendering
    setTimeout(() => {
      document.getElementById("new-arrivals-grid").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    //combines all the mapped HTML snippets into one big string so they render correctly inside your cart container.
    document.getElementById("resultCount").textContent =
      visible + " record" + (visible !== 1 ? "s" : "");
  } catch (error) {
    console.error("Error displaying products:", error);
    showToast("Something went wrong while displaying products.");
  }
}

function filterGenre(button) {
  // Remove active class from all buttons and add to the clicked button
  document
    .querySelectorAll(".filter-btn")
    .forEach((button) => button.classList.remove("active"));
  button.classList.add("active");
  // Update the current genre and refresh the product display
  currentGenre = button.dataset.genre;
  displayProducts();
}

function searchRecords(value) {
  currentSearch = value.toLowerCase().trim();
  displayProducts();
}

function toggleCart() {
  // Toggle the 'open' class on the cart sidebar to show/hide it
  document.getElementById("cartSidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("open");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  // Add the 'show' class to make the toast visible
  toast.classList.add("show");
  // Remove the 'show' class after 3 seconds
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function addToCart(id) {
  try {
    // Check if products array is empty
    if (!products || products.length === 0) {
      console.warn("Products list is empty — cannot add item to cart yet.");
      showToast("Products are still loading. Please try again in a moment.");
      return;
    }

    // Find the product by ID
    const product = products.find((prod) => prod.id === id);

    if (!product) {
      console.error("Product not found:", id);
      showToast("This product could not be found.");
      return;
    }

    // Add to cart if not already there
    if (!cart.find((prod) => prod.id === id)) {
      cart.push({ ...product, qty: 1 });
      document.getElementById("btn-" + id).textContent = "Added";
      document.getElementById("btn-" + id).classList.add("added");
      saveCart();
      updateCart();
      toggleCart();
      showToast('"' + product.title + '" added to cart');
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);
    showToast("Something went wrong while adding to cart.");
  }
  console.log("Products array:", products);
  console.log("Trying to add ID:", id);
}

function removeFromCart(productId) {
  // Remove the product from the cart by filtering it out
  cart = cart.filter((item) => item.id !== productId);
  const product = products.find((prod) => prod.id === productId);
  saveCart();
  const btn = document.getElementById("btn-" + productId);
  if (btn) {
    // Update the button to indicate the product can be added again
    btn.textContent = "Add";
    // Remove the 'added' class to reset the button state
    btn.classList.remove("added");
  }
  updateCart();
  showToast('"' + product.title + '" removed from cart');
}

function updateQty(id, newQty) {
  const item = cart.find((p) => p.id === id);
  if (!item) return;

  const qty = parseInt(newQty);
  if (isNaN(qty) || qty < 1) {
    showToast("Quantity must be at least 1.");
    return;
  }

  item.qty = qty;
  saveCart();
  updateCart();
}

function updateCart() {
  try {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    // Header cart button
    document.getElementById("cartCount").textContent = count;

    // Filters cart button - check
    const filterCount = document.getElementById("cartCountFilter");
    // Update the filter cart count if the element exists
    if (filterCount) filterCount.textContent = count;

    // Calculate total safely
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    document.getElementById("cartTotal").textContent = "€" + total.toFixed(2);

    const element = document.getElementById("cartItems");

    if (cart.length === 0) {
      element.innerHTML = `
    <div class="cart-empty">
      <i 
        class="ti ti-disc" 
        style="font-size:2.5rem; opacity:.3; color:var(--warm-gray)" 
        aria-hidden="true">
      </i>
      <p>Your cart is empty</p>
    </div>
  `;
    } else {
      element.innerHTML = cart
        .map(
          (item) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-title">${item.title}</p>
            <p class="cart-item-artist">${item.artist}</p>
            <p class="cart-item-price">€${Number(item.price).toFixed(2)}</p>
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
            >

            <button 
              class="cart-item-remove" 
              onclick="removeFromCart(${item.id})" 
              aria-label="Remove ${item.title}">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </div>
      `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    showToast("Something went wrong while updating your cart.");
  }
}

displayProducts();
updateCart();

// After initial render, check if we should auto-open the cart
const params = new URLSearchParams(window.location.search);
if (params.get("openCart") === "1") {
  // small timeout so DOM & cart render first
  setTimeout(() => {
    toggleCart();
  }, 200);
}

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
