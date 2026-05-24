let products = [];
let cart = [];
let currentGenre = 'all';
let currentSearch = '';

function displayProducts() {
    const grid = document.getElementById("productGrid");
    //Variable to track how many products are visible after filtering
    let visible = 0;
    // For each product, check if it matches the current genre and search term
    grid.innerHTML = products.map(product => {
        // Determine if the product should be shown based on genre and search filters
        const show = (currentGenre === 'all' || product.genre === currentGenre) &&
            (product.title.toLowerCase().includes(currentSearch) || product.artist.toLowerCase().includes(currentSearch));
            // If the product matches the filters, increment the visible count
            if(show) visible++;
         // Check if the product is already in the cart
        const inCart = cart.find(item => item.id === product.id);
        return `<div class="product-card${show ? '' : ' hidden'}" id= card-${product.id}>
        <div class="card-img">
           <p>Coming soon form an api</p>
        </div>
        <div class="card-body">
          <p class="card-genre">${product.genre}</p>
          <h3 class="card-title">${product.title}</h3>
          <p class="card-artist">${product.artist}</p>
          <div class="card-footer">
           <span class="card-price">£${product.price}</span>
           <button class="add-btn"${inCart ? ' added' : ''}" id="btn-${product.id}" onclick="addToCart(${product.id})">
           ${inCart ? 'Added' : 'Add'}
              </button>
            </div>
            </div>
            </div>`;
    }).join('');
    //combines all the mapped HTML snippets into one big string so they render correctly inside your cart container.
    document.getElementById('resultCount').textContent = visible + ' record'+(visible !==1 ? 's' : '');          
}

async function loadProducts() {
    try {
        const response = await fetch("http://localhost:3000/products");
        products = await response.json();
        displayProducts();
    }

    catch (error) {
        console.error("Error loading products:", error);
    }}

    loadProducts();

    function filterGenre(button) {
        // Remove active class from all buttons and add to the clicked button
        document.querySelectorAll('.filter-btn').forEach(button => button.classList.remove('active'));
        button.classList.add('active');
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
        document.getElementById('cartSidebar').classList.toggle('open');
        document.getElementById('cartOverlay').classList.toggle('open');
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message; 
        // Add the 'show' class to make the toast visible
        toast.classList.add('show');
        // Remove the 'show' class after 3 seconds
        setTimeout(() => toast.classList.remove('show'), 2200);
        }; 

    function addToCart(productId) {
        // Find the product by ID and add it to the cart if it's not already there
        const product = products.find (p => p.id === productId);
        // Check if the product is already in the cart to prevent duplicates
        if (!cart.find(item => item.id === productId)) {
            // Add the product to the cart with an initial quantity of 1
            cart.push({...product, quantity: 1}); 
            // Update the button to indicate the product has been added
            document.getElementById('btn-' + productId).textContent='Added';
            document.getElementById('btn-' + productId).classList.add('added');
            updateCart();
            showToast('"' + product.title + '" added to cart');
        }
    }

    function removeFromCart(productId) {
        // Remove the product from the cart by filtering it out
        cart = cart.filter(item => item.id !== productId); 
        const btn = document.getElementById('btn-' + productId);
        if (btn) {
            // Update the button to indicate the product can be added again
            btn.textContent = 'Add';
            // Remove the 'added' class to reset the button state
            btn.classList.remove('added');
        }
        updateCart();
    }

    function updateCart() {
        const count = cart.length;
        document.getElementById('cartCount').textContent = count;
        const total = cart.reduce ((sum, item) => sum + item.price, 0);
        document.getElementById('cartTotal').textContent = '€'+total.toFixed(2);
        const element = document.getElementById('cartItems');
        if (cart.length === 0) {
            element.innerHTML = `<div class="cart-empty">
            <i class="ti ti-disc" style="font-size:2.5rem;
            opacity:.3;
            color:var(--warm-gray)" 
            aria-hidden="true">
            </i><p>Your cart is empty</p></div>`;
        } else {
            element.innerHTML = cart.map (item => `<div class="cart-item">
        <div class="cart-item-info">
          <p class="cart-item-title">${item.title}</p>
          <p class="cart-item-artist">${item.artist}</p>
          <p class="cart-item-price">€${item.price}</p>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" 
        aria-label="Remove ${item.title}">
        <i class="ti ti-x"></i>
        </button>
      </div>`).join('');
        }
    }

    displayProducts();
    updateCart();