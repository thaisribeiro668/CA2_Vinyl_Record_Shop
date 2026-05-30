const SHIPPING = 4.5;
let cart = [];
let discountApplied = false;

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

// After the order is placed, the cart needs to be emptied from local storage as well
function clearCart() {
  localStorage.removeItem("cart");
}

// Function to Render order items
// First it get the cart from the local storage, then select the html elements that will be used
// If cart isn't empty and html elements are available, show the items that are currently in the cart
// Update the total of the order
function renderOrder() {
  loadCartFromStorage();
  const layout = document.getElementById("checkoutLayout");
  const empty = document.getElementById("emptyState");

  if (!layout || !empty) return;

  if (!cart.length) {
    layout.style.display = "none";
    empty.style.display = "block";
    return;
  }

  const container = document.getElementById("orderItems");
  if (container) {
    // Variable created to force Prettier extension to format this part of the code
    const html = String.raw;
    container.innerHTML = cart
      .map(
        (item) => html`
          <div class="order-item">
            ${item.image
              ? `<img class="order-item-img" src="${item.image}" alt="${item.title}">`
              : `<div class="order-item-img placeholder"><i class="ti ti-vinyl"></i></div>`}
            <div class="order-item-info">
              <div class="order-item-title">${item.title}</div>
              <div class="order-item-artist">${item.artist}</div>
              <div class="order-item-qty">
                <label for="qty-${item.id}" class="qty-label">Qty:</label>
                <input
                  type="number"
                  id="qty-${item.id}"
                  class="qty-input order-qty-input"
                  min="1"
                  value="${item.qty}"
                  onchange="updateQty(${item.id}, this.value)"
                />
              </div>
            </div>
            <div class="order-item-price">
              €${(item.price * item.qty).toFixed(2)}
            </div>
            <button
              class="order-item-remove"
              onclick="removeFromCart(${item.id})"
              aria-label="Remove ${item.title}"
            >
              <i class="ti ti-trash"></i>
            </button>
          </div>
        `,
      )
      .join("");
  }

  updateTotals();
}

// Totals: function that sums the values of all the items in the cart/checkout page
// It adds shipping cost to the final price
function updateTotals() {
  const subtotal = cart.reduce((subtotalSoFar, cartItem) => subtotalSoFar + cartItem.price * cartItem.qty, 0);
  const grand = subtotal + SHIPPING;

  const subtotalEl = document.getElementById("subtotalVal");
  const shippingEl = document.getElementById("shippingVal");
  const grandEl = document.getElementById("grandVal");

  if (subtotalEl) subtotalEl.textContent = "€" + subtotal.toFixed(2);
  if (shippingEl) shippingEl.textContent = "€" + SHIPPING.toFixed(2);
  if (grandEl) grandEl.textContent = "€" + grand.toFixed(2);
}

// Payment tabs: function that controls the hover effect and the phrase or grid that is shown
// according to the type of payment that the user chooses
// If user chooses payment by card, then the card grid form will show up
function selectTab(btn, type) {
  document
    .querySelectorAll(".pay-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("cardFields").style.display =
    type === "card" ? "grid" : "none";
  document.getElementById("paypalMsg").style.display =
    type === "paypal" ? "block" : "none";
  document.getElementById("bankMsg").style.display =
    type === "bank" ? "block" : "none";
}

// Card formatting: function to format the way the card number is shown in the card form
// It Takes the input value, Removes all non digits .replace(/\D/g, ""), Limits it to 16 digits (substring(0, 16))
// and Reformats it into groups of 4 digits (/(.{4})/g, "$1 ")  
function formatCard(element) {
  let cardNumber = element.value.replace(/\D/g, "").substring(0, 16);
  element.value = cardNumber.replace(/(.{4})/g, "$1 ").trim();
}

// Card formatting: function to format the way the card expiry is shown in the card form
// It Takes the input value, Removes all non digits .replace(/\D/g, ""), Limits it to 4 digits substring(0, 4)
// If there are at least 3 digits, it inserts the separator "/"
// Finally, it writes the formatted value back into the input.
function formatExpiry(element) {
  let cardExpiry = element.value.replace(/\D/g, "").substring(0, 4);
  if (cardExpiry.length >= 3) cardExpiry = cardExpiry.substring(0, 2) + " / " + cardExpiry.substring(2);
  element.value = cardExpiry;
}

// FORM VALIDATION
// Function to validate a single form field
// First it selects the input element by its ID. If the element doesn't exist
// (for example, when certain payment fields are hidden), the function returns true
// so the validation flow can continue normally.
// Then it trims the input value and checks it against the provided pattern.
// If the value does not match the pattern, a toast message is shown, the field
// receives focus again, and the function returns false to stop form submission.
// If the value is valid, the function returns true.
function validateField(id, pattern, message) {
  const element = document.getElementById(id);
  if (!element) return true; // fallback if payment field hidden
  const value = element.value.trim();
  if (!pattern.test(value)) {
    showToast(message);
    element.focus();
    return false;
  }
  return true;
}

// Function to validate the entire checkout form
// First it checks all required fields by ID to ensure they exist and are not empty.
// If any required field is missing or blank, the field is highlighted, focused,
// a toast message is shown, and the function stops by returning false.
// After structural checks, the function defines all validation patterns used for
// names, email, address, phone, postal code, and CVV.
// Each field is then validated using validateField(), which tests the value
// against the appropriate pattern. If any validation fails, a toast message is
// shown and the function returns false.
// The phone number is optional, so it is validated only when the user enters a value.
// Finally, if the credit‑card section is visible, the function validates the
// cardholder name and CVV as well.
// If all checks pass successfully, the function returns true and the form can proceed.
function formValidation() {
  // Required structural input checks (Matches exactly your HTML Element IDs)
  const required = [
    "firstName",
    "lastName",
    "email",
    "address",
    "city",
    "postcode",
  ];
  for (const id of required) {
    const element = document.getElementById(id);
    if (!element || !element.value.trim()) {
      if (element) {
        element.focus();
        element.style.borderColor = "var(--red)";
        setTimeout(() => (element.style.borderColor = ""), 2000);
      }
      showToast("Please fill in all required fields.");
      return false;
    }
  }

  // Patterns
  const namePattern = /^[A-Za-zÀ-ÿ\s'-]+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const addressPattern = /^(?=.*\d)[A-Za-z0-9À-ÿ\s.,'-]+$/;
  const phonePattern = /^[0-9\s+]{7,15}$/; // padded regex to allow blank spaces or indicators
  const eircodePattern = /^[A-Za-z0-9\s]{4,8}$/;
  const cvvPattern = /^[0-9]{3,4}$/;

  if (
    !validateField("firstName", namePattern, "Please enter a valid First Name.")
  )
    return false;
  if (
    !validateField("lastName", namePattern, "Please enter a valid Last Name.")
  )
    return false;
  if (
    !validateField("email", emailPattern, "Please enter a valid email address.")
  )
    return false;

  const phoneVal = document.getElementById("phone").value.trim();
  if (phoneVal && !phonePattern.test(phoneVal)) {
    showToast("Please enter a valid phone number.");
    return false;
  }

  if (
    !validateField("address", addressPattern, "Please enter a valid address.")
  )
    return false;
  if (!validateField("city", namePattern, "Please enter a valid city."))
    return false;
  if (
    !validateField(
      "postcode",
      eircodePattern,
      "Please enter a valid Postal Code.",
    )
  )
    return false;

  // Check card validation inputs only if Credit Card mode is open and visible
  if (document.getElementById("cardFields").style.display !== "none") {
    if (
      !validateField("cardName", namePattern, "Please enter a valid card name.")
    )
      return false;
    if (!validateField("cvv", cvvPattern, "Please enter a valid CVV."))
      return false;
  }

  return true;
}

// Place order
// Function to submit the checkout order
// First it runs the full form validation. If any field is invalid, the function
// stops immediately and the order is not submitted.
// When validation passes, the "Place order" button is disabled and replaced with
// a loading spinner to prevent duplicate submissions.
// The function then collects all form values into a formData object, mapping
// each field to the expected API property names.
// A POST request is sent to the backend checkout endpoint. If the request is
// successful, the cart is cleared, a random order number is generated, and the
// success overlay is displayed to the user.
// If the server responds with an error, the error message is shown and the
// button is re‑enabled so the user can try again.
// If a network error occurs (e.g., server offline), an alert is shown and the
// button is restored to its original state.
async function placeOrder() {
  if (!formValidation()) return;

  const btn = document.getElementById("placeBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite; display:inline-block"></i> Processing…';
  }

  // Adjusted mappings to target "address" and "component" safely
  const formData = {
    first_name: document.getElementById("firstName").value,
    last_name: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    street_address: document.getElementById("address").value,
    complement: document.getElementById("component").value,
    city: document.getElementById("city").value,
    postcode: document.getElementById("postcode").value,
    country: document.getElementById("country").value,
  };

  try {
    const response = await fetch("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      clearCart();

      const num = "GG-" + Math.floor(100000 + Math.random() * 900000);
      document.getElementById("orderNum").textContent = "Order #" + num;
      document.getElementById("successOverlay").classList.add("show");
    } else {
      const errorData = await response.json();
      alert("Error saving order: " + (errorData.error || "Unknown error"));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-lock"></i> Place order';
      }
    }
  } catch (error) {
    console.error("Network Error:", error);
    alert("Could not connect to the database server.");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-lock"></i> Place order';
    }
  }
}

// Function to show temporary messages like "Product Added to the cart" or "Product removed from the cart"
function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = `
      position:fixed;
      bottom:2rem;
      left:50%;
      transform:translateX(-50%) translateY(20px);
      background:var(--ink);
      color:white;
      padding:.7rem 1.4rem;
      border-radius:var(--radius);
      font-family:var(--font-mono);
      font-size:.78rem;
      letter-spacing:.06em;
      opacity:0;
      transition:all .3s;z-index:9999;pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(20px)";
  }, 2200);
}

// ASIDE SIDEBAR LOGIC
// Function to update the cart: first the count variable will store the sum of all the items that are in the cart and return
// the total number of items in the card
// Following that, it will select the cart button and the cart count of items
// If items to be counted exists, the cart counter will be updated
// The total will be calculated considering prices * qty and the correspondent html element will be updated
// Then cartItems element will be selected and if there's no items in the cart a message will be shown
// And if there are items in the cart the products will be shown according to the html informed
function updateCart() {
  try {
    loadCartFromStorage();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const countEl = document.getElementById("cartCount");
    if (countEl) countEl.textContent = count;

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalEl = document.getElementById("cartTotal");
    if (totalEl) totalEl.textContent = "€" + total.toFixed(2);

    const element = document.getElementById("cartItems");
    if (!element) return;

    if (cart.length === 0) {
      element.innerHTML = `
        <div class="cart-empty">
          <i class="ti ti-vinyl" aria-hidden="true" style="font-size:2.5rem;opacity:.3;color:var(--warm-gray)"></i>
          <p>Your cart is empty</p>
        </div>`;
    } else {
      element.innerHTML = cart
        .map(
          (item) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <p class="cart-item-title">${item.title}</p>
            <p class="cart-item-artist">${item.artist}</p>
            <p class="cart-item-price">€${(item.price * item.qty).toFixed(2)}</p>
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
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remove ${item.title}">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        </div>`,
        )
        .join("");
    }
  } catch (error) {
    console.error("Error updating cart:", error);
  }
}

// Toggle the 'open' class on the cart sidebar to show/hide it
function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  }
}

// Function to remove a product from cart: first it uses the filter function with this condition:
// If the item’s ID is not equal to the product wanted to remove, keep it
// If the item’s ID matches, remove it
// Then save the cart and find the button for that specific product, so it can be changed to "Add" text again
// Following, the specific product data is stored into a variable so its title can be used in the temporary message
// that informs that the item was successfully removed
// Finally, calls updateCart function and shows the temporary message
function removeFromCart(productId) {
  const removedItem = cart.find((item) => item.id === productId);
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCart();
  renderOrder();

  if (removedItem) {
    showToast(`"${removedItem.title}" removed from cart`);
  }
}

function updateQty(id, newQty) {
  const item = cart.find((p) => p.id === id);
  if (!item) return;
  const qty = parseInt(newQty);
  if (!isNaN(qty) && qty > 0) {
    item.qty = qty;
    saveCart();
    updateCart();
    renderOrder();
  }
}

renderOrder();
updateCart();

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
