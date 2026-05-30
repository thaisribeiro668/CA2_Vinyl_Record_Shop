let cart = [];

// Function to load the cart from the local storage
// By doing that, the cart is the same in all of the pages of the website, avoiding purchase conflicts
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

// Function to update the cart: first the count variable will store the sum of all the items that are in the cart and return
// the total number of items in the card
// Following that, it will select the cart button and the cart counter of items
// If items to be counted exists, the cart counter will be updated
// The total will be calculated considering prices * qty and the correspondent html element will be updated
// Then cartItems element will be selected and if there's no items in the cart a message will be shown
// And if there are items in the cart the products will be shown according to the html informed
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

// Toggle the 'open' class on the cart sidebar to show/hide it
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

// Function to remove a product from cart: first it uses the filter function with this condition:
// If the item’s ID is not equal to the product wanted to remove, keep it
// If the item’s ID matches, remove it
// Then save the cart and find the button for that specific product, so it can be changed to "Add" text again
// Following, the specific product data is stored into a variable so its title can be used in the temporary message
// that informs that the item was successfully removed
// Finally, calls updateCart function and shows the temporary message
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

// Function to show temporary messages like "Product Added to the cart" or "Product removed from the cart"
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  // Add the 'show' class to make the toast visible
  toast.classList.add("show");
  // Remove the 'show' class after 3 seconds
  setTimeout(() => toast.classList.remove("show"), 2200);
}

updateCart();

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
// If the operation was successful or not, an appropriate message will be shown to the user
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
