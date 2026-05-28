const SHIPPING = 4.50;
let cart = [];
let discountApplied = false;

// ── Load cart ──
function loadCartFromStorage() {
  const stored = localStorage.getItem("cart");
  cart = stored ? JSON.parse(stored) : [];
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem('cart');
}

// ── Render order items ──
function renderOrder() {
  loadCartFromStorage();
  const layout = document.getElementById('checkoutLayout');
  const empty  = document.getElementById('emptyState');

  if (!layout || !empty) return;

  if (!cart.length) {
    layout.style.display = 'none';
    empty.style.display  = 'block';
    return;
  }

  const container = document.getElementById('orderItems');
  if (container) {
    container.innerHTML = cart.map(item => `
      <div class="order-item">
        ${item.image
          ? `<img class="order-item-img" src="${item.image}" alt="${item.title}">`
          : `<div class="order-item-img placeholder"><i class="ti ti-vinyl"></i></div>`}
        <div class="order-item-info">
          <div class="order-item-title">${item.title}</div>
          <div class="order-item-artist">${item.artist}</div>
          <div class="order-item-qty">Qty: ${item.qty}</div>
        </div>
        <div class="order-item-price">€${(item.price * item.qty).toFixed(2)}</div>
      </div>
    `).join('');
  }

  updateTotals();
}

// ── Totals ──
function updateTotals() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const grand = subtotal + SHIPPING;

  const subtotalEl = document.getElementById('subtotalVal');
  const shippingEl = document.getElementById('shippingVal');
  const grandEl = document.getElementById('grandVal');

  if (subtotalEl) subtotalEl.textContent = '€' + subtotal.toFixed(2);
  if (shippingEl) shippingEl.textContent = '€' + SHIPPING.toFixed(2);
  if (grandEl) grandEl.textContent    = '€' + grand.toFixed(2);
}


// ── Payment tabs ──
function selectTab(btn, type) {
  document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cardFields').style.display  = type === 'card'   ? 'grid' : 'none';
  document.getElementById('paypalMsg').style.display   = type === 'paypal' ? 'block' : 'none';
  document.getElementById('bankMsg').style.display     = type === 'bank'   ? 'block' : 'none';
}

// ── Card formatting ──
function fmtCard(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 16);
  el.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.substring(0,2) + ' / ' + v.substring(2);
  el.value = v;
}

// VALIDATION - id = tagid
function validateField(id, pattern, message) {
  const el = document.getElementById(id);
  if (!el) return true; // fallback if payment field hidden
  const value = el.value.trim();
  if (!pattern.test(value)) {
    showToast(message);
    el.focus();
    return false;
  }
  return true;
}

function formValidation() {
  // Required structural input checks (Matches exactly your HTML Element IDs)
  const required = ['firstName','lastName','email','address','city','postcode'];
  for (const id of required) {
    const element = document.getElementById(id);
    if (!element || !element.value.trim()) {
      if (element) {
        element.focus();
        element.style.borderColor = 'var(--red)';
        setTimeout(() => element.style.borderColor = '', 2000);
      }
      showToast('Please fill in all required fields.');
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
  
  if (!validateField('firstName', namePattern, 'Please enter a valid First Name.')) return false;
  if (!validateField('lastName', namePattern, 'Please enter a valid Last Name.')) return false;
  if (!validateField('email', emailPattern, 'Please enter a valid email address.')) return false;
  
  const phoneVal = document.getElementById('phone').value.trim();
  if (phoneVal && !phonePattern.test(phoneVal)) {
    showToast('Please enter a valid phone number.');
    return false;
  }

  if (!validateField('address', addressPattern, 'Please enter a valid address.')) return false;
  if (!validateField('city', namePattern, 'Please enter a valid city.')) return false;
  if (!validateField('postcode', eircodePattern, 'Please enter a valid Postal Code.')) return false;

  // Check card validation inputs only if Credit Card mode is open and visible
  if (document.getElementById('cardFields').style.display !== 'none') {
    if (!validateField('cardName', namePattern, 'Please enter a valid card name.')) return false;
    if (!validateField('cvv', cvvPattern, 'Please enter a valid CVV.')) return false;
  }

  return true;
}

// ── Place order ──
async function placeOrder() {
  if (!formValidation()) return;

  const btn = document.getElementById('placeBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite; display:inline-block"></i> Processing…';
  }

  // Adjusted mappings to target "address" and "component" safely
  const formData = {
    first_name: document.getElementById('firstName').value,
    last_name: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    street_address: document.getElementById('address').value,
    complement: document.getElementById('component').value,
    city: document.getElementById('city').value,
    postcode: document.getElementById('postcode').value,
    country: document.getElementById('country').value
  };

  try {
    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      clearCart();
      
      const num = 'GG-' + Math.floor(100000 + Math.random() * 900000);
      document.getElementById('orderNum').textContent = 'Order #' + num;
      document.getElementById('successOverlay').classList.add('show');
    } else {
      const errorData = await response.json();
      alert('Error saving order: ' + (errorData.error || 'Unknown error'));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-lock"></i> Place order';
      }
    }
  } catch (error) {
    console.error('Network Error:', error);
    alert('Could not connect to the database server.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-lock"></i> Place order';
    }
  }
}

// ── Toast ──
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
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
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2200);
}

// Spinner CSS injection helper
const styleHelper = document.createElement('style');
styleHelper.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleHelper);

// ASIDE SIDEBAR LOGIC
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
      element.innerHTML = cart.map(item => `
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
        </div>`
      ).join("");
    }
  } catch (error) {
    console.error("Error updating cart:", error);
  }
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId); 
  saveCart();
  updateCart();
  showToast('"'+ product.title + '" removed from cart');
  renderOrder();
}

function updateQty(id, newQty) {
  const item = cart.find(p => p.id === id);
  if (!item) return;
  const qty = parseInt(newQty);
  if (!isNaN(qty) && qty > 0) {
    item.qty = qty;
    saveCart();
    updateCart();
    renderOrder();
  }
}

// ── Boot Initialization ──
renderOrder();
updateCart();


function sendNewsletterSubscription() {
  // Finds the input field using the class name from your HTML
  const newsletterInput = document.querySelector('.newsletter-input');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Clean up the text input value
  const emailValue = newsletterInput.value.trim();

  // Correct syntax: regexPattern.test(stringToTest)
  if (!emailPattern.test(emailValue)) {
    showToast("Please enter a valid email address.");
  } else {
    showToast("Thank you for subscribing to our newsletter!");
    newsletterInput.value = ''; // Clears the input field box on success
  }
}