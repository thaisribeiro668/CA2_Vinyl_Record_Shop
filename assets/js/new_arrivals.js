let products = [];
let cart = [];
let badge = "New";
let currentSearch = "";

// Function to load the cart from the local storage
// By doing that, the cart is the same in all of the pages of the website, avoiding purcharse conflicts
// If there's items on the cart, parse it into an array, or else, keep it as an empty array
function loadCartFromStorage() {
  const stored = localStorage.getItem("cart");
  cart = stored ? JSON.parse(stored) : [];
}

// Function to save the cart in the local storage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

loadCartFromStorage();

// Function to load all the products from the database
// The function fetches the data from the /products endpoint, which connects to MySQL database and gets the available data from products table
// If the call is successfull, the products available in MySQL will be displayed throught the function displayProducts
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
    // Scroll AFTER rendering
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

// Filter Genre button function
// First, it removes the active class from all buttons and add to the clicked button
// Then it adds the class Active to the button that was selected by the user
// Following, it reads the data from the clicked button and the product, store it on currentGenre variable and displays products according to this value
function filterGenre(button) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((button) => button.classList.remove("active"));
  button.classList.add("active");
  // Update the current genre and refresh the product display
  currentGenre = button.dataset.genre;
  displayProducts();
}

// This function starts in the html input search tag where it says "oninput" use this function
// This function will then read the value that was inserted in the product and display the products following this value
function searchRecords(value) {
  currentSearch = value.toLowerCase().trim();
  displayProducts();
}

// Toggle the 'open' class on the cart sidebar to show/hide it
function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("open");
}

// Function to show temporary messages like "Product Added to the cart" or "Product removed from the cart"
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  // Add the 'show' class to make the toast visible
  toast.classList.add("show");
  // Remove the 'show' class after 3 seconds
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// Function to add a product to the cart: if products array is not empty, find the product by ID
// If it is found, check if it's not already in the cart and if it is not, add the product to the cart variable
// The text of the button is changed to Added, it's class is also changed to added to specific formatting
// Then the cart is saved, updated, become visible in the page and a temporary message is shown
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

// Function to remove a product from cart: first it uses the filter function with this condition:
// If the item’s ID is not equal to the product wanted to remove, keep it
// If the item’s ID matches, remove it
// Then save the cart and find the button for that specific product, so it can be changed to "Add" text again
// Following, the specific product data is stored into a variable so its title can be used in the temporary message
// that informs that the item was sucessfully removed
// Finnally, calls updateCart function and shows the temporary message
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

// Function to Update the Quantity of Products in the cart
// First look for the product by its ID, then convert the quantity inserted by the user to Integer
// Show a message if it is not a number or quatity is less than 1
// Then update the quantity according to the quantity informed by the user
// Save and update the cart
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

// Function to update the cart: first the count variable will store the sum of all the items that are in the cart and return
// the total number of items in the card
// Following that, it will select the cart button and the cart couter of items
// If items to be counted exists, the cart counter will be updated
// The total will be calculated considering prices * qty and the correspondent html element will be updated
// Then cartItems element will be selected and if there's no items in the cart a message will be shown
// And if there are items in the cart the products will be shown according to the html informed
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

// After initial render, check if it is necessary to auto-open the cart
const params = new URLSearchParams(window.location.search);
if (params.get("openCart") === "1") {
  // small timeout so DOM & cart render first
  setTimeout(() => {
    toggleCart();
  }, 200);
}

// Proceed to Checkout Button Function: an Event Listener was added to the button and when a click happens
// It will be checked if there are products in the cart.
// If there are products in the cart, the user will be redirected to the Checkout Page
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

// Function to send the user's newsletter email to the MySQL database
// First it, selects the input field using the class name from HTML
// Then it compares the value that was inserted by the user with the Regex of an email address
// If an invalid email was inserted, a notification message will be shown
// If a valid email was inserted, then a POST request will be done to the MySQL database using the email informed by the user
// The fetch function is used to access the server endpoint, together with the method that will be used and the email that will be converted into a string
// If the operation was successfull or not, an appropriate message will be shown to the user
function sendNewsletterSubscription() {
  // Finds the input field using the class name from your HTML
  const newsletterInput = document.querySelector(".newsletter-input");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Removes spaces in the text input value
  const emailValue = newsletterInput.value.trim();

  if (!emailPattern.test(emailValue)) {
    showToast("Please enter a valid email address.");
  } else {
    showToast("Thank you for subscribing to our newsletter!");
    newsletterInput.value = ""; // Clears the input field box on success
  }
}
