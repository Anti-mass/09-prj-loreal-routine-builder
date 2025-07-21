/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const productSearch = document.getElementById("productSearch");
const userLang = navigator.language || navigator.userLanguage;
document.addEventListener('DOMContentLoaded', () => {
      const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
      const userLang = navigator.language || navigator.userLanguage; // e.g., "ar-SA"
      const langCode = userLang.split('-')[0]; // "ar"

      // Set direction and lang attribute
      if (rtlLanguages.includes(langCode)) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', langCode);
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', langCode);
      }
    });

/* Array to keep track of selected products */
let selectedProducts = [];

/* Array to keep track of the conversation history for the chat */
let conversationHistory = loadConversationHistory(); // Load from localStorage on startup

/* -------- localStorage helpers -------- */
// Save selected products to localStorage
function saveSelectedProducts() {
  localStorage.setItem(
    "selectedProducts",
    JSON.stringify(selectedProducts.map((p) => p.id))
  );
}

// Load selected products from localStorage (returns array of IDs)
function loadSelectedProductIds() {
  const ids = localStorage.getItem("selectedProducts");
  return ids ? JSON.parse(ids) : [];
}

// Save chat history to localStorage
function saveConversationHistory() {
  localStorage.setItem(
    "conversationHistory",
    JSON.stringify(conversationHistory)
  );
}

// Load chat history from localStorage
function loadConversationHistory() {
  const history = localStorage.getItem("conversationHistory");
  return history ? JSON.parse(history) : [];
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* -------- Modal window setup -------- */
// Create modal HTML and add to body
const modal = document.createElement("div");
modal.className = "product-modal";
modal.innerHTML = `
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <button class="modal-close" aria-label="Close description">&times;</button>
    <h3 id="modalTitle"></h3>
    <p id="modalBrand"></p>
    <div id="modalDesc"></div>
  </div>
`;
modal.style.display = "none";
document.body.appendChild(modal);

// Close modal function
function closeModal() {
  modal.style.display = "none";
}

// Listen for close button and Escape key
modal.querySelector(".modal-close").addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (modal.style.display === "block" && e.key === "Escape") {
    closeModal();
  }
});

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Restore selected products from localStorage */
async function restoreSelectedProducts() {
  const products = await loadProducts();
  const ids = loadSelectedProductIds();
  selectedProducts = products.filter((p) => ids.includes(p.id));
  updateSelectedProducts();
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${
      selectedProducts.some((p) => p.id === product.id) ? " selected" : ""
    }" 
         data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="desc-btn" data-product-id="${
          product.id
        }">View Description</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to each product card for selection
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      // Prevent selection if clicking the description button
      if (event.target.classList.contains("desc-btn")) return;
      const productId = card.getAttribute("data-product-id");
      const product = products.find((p) => p.id == productId);

      // Check if product is already selected
      const index = selectedProducts.findIndex((p) => p.id == productId);
      if (index === -1) {
        // Add product to selectedProducts
        selectedProducts.push(product);
      } else {
        // Remove product from selectedProducts
        selectedProducts.splice(index, 1);
      }
      saveSelectedProducts();
      displayProducts(products);
      updateSelectedProducts();
    });
  });

  // Add click event listeners for description buttons
  const descBtns = productsContainer.querySelectorAll(".desc-btn");
  descBtns.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent card selection
      const productId = btn.getAttribute("data-product-id");
      const product = products.find((p) => p.id == productId);
      // Fill modal with product info
      modal.querySelector("#modalTitle").textContent = product.name;
      modal.querySelector("#modalBrand").textContent = product.brand;
      modal.querySelector("#modalDesc").textContent = product.description;
      modal.style.display = "block";
      // Focus close button for accessibility
      modal.querySelector(".modal-close").focus();
    });
  });
}

/* Update the Selected Products section */
function updateSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    // Show clear button only if there are items
    if (document.getElementById("clearSelectedBtn")) {
      document.getElementById("clearSelectedBtn").remove();
    }
    return;
  }
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="product-card" style="flex: 0 1 180px; position:relative;">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <button class="remove-selected-btn" data-product-id="${product.id}" aria-label="Remove ${product.name}" title="Remove">&#10006;</button>
      </div>
    `
    )
    .join("");
  // Add "Clear All" button if not present
  if (!document.getElementById("clearSelectedBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.className = "generate-btn";
    clearBtn.style.marginTop = "10px";
    clearBtn.onclick = () => {
      selectedProducts = [];
      saveSelectedProducts();
      updateSelectedProducts();
      // Re-render products grid to update selection state
      categoryFilter.dispatchEvent(new Event("change"));
    };
    selectedProductsList.parentElement.appendChild(clearBtn);
  }

  // Add event listeners for remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(
    ".remove-selected-btn"
  );
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = btn.getAttribute("data-product-id");
      selectedProducts = selectedProducts.filter((p) => p.id != productId);
      saveSelectedProducts();
      updateSelectedProducts();
      // Re-render products grid to update selection state
      categoryFilter.dispatchEvent(new Event("change"));
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
});

// Get reference to the "Generate Routine" button
const generateRoutineBtn = document.getElementById("generateRoutine");

// Helper to render the full chat history in the chat window
function renderChatHistory() {
  chatWindow.innerHTML = conversationHistory
    .filter((msg) => msg.role === "assistant" || msg.role === "user")
    .map((msg) => {
      if (msg.role === "user") {
        return `<div class="chat-message user"><strong>You:</strong> ${msg.content}</div>`;
      } else {
        return `<div class="chat-message assistant"><strong>Advisor:</strong> ${convertMarkdownToHtml(
          msg.content
        )}</div>`;
      }
    })
    .join("");
  // Scroll to bottom for latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to call OpenAI API and display the routine
async function generateRoutineWithAI(selectedProducts) {
  chatWindow.innerHTML = "Generating your routine...";

  // Prepare initial system message
  const systemMessage = {
    role: "system",
    content:
      "You are a helpful beauty routine assistant. Suggest a routine using the provided products. Be clear and beginner-friendly. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, or other beauty topics.",
  };

  // Prepare user message with selected products
  const userMessage = {
    role: "user",
    content: `Here are the selected products:\n${selectedProducts
      .map(
        (p) =>
          `Name: ${p.name}\nBrand: ${p.brand}\nCategory: ${p.category}\nDescription: ${p.description}`
      )
      .join("\n\n")}\n\nPlease generate a routine using these products.`,
  };

  // If chat history is empty, start with system and user message
  if (conversationHistory.length === 0) {
    conversationHistory = [systemMessage, userMessage];
  } else {
    // Otherwise, add new user message to history
    conversationHistory.push(userMessage);
  }

  try {
    const response = await fetch("https://lorealbot.oosawe.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory,
        max_tokens: 500,
      }),
    });
    const data = await response.json();
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      saveConversationHistory();
      renderChatHistory();
    } else {
      conversationHistory.push({
        role: "assistant",
        content: "Sorry, I couldn't generate a routine. Please try again.",
      });
      saveConversationHistory();
      renderChatHistory();
    }
  } catch (error) {
    conversationHistory.push({
      role: "assistant",
      content:
        "Error connecting to OpenAI. Please check your API key and try again.",
    });
    saveConversationHistory();
    renderChatHistory();
  }
}

// Add click event listener to "Generate Routine" button
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    conversationHistory.push({
      role: "assistant",
      content:
        "Please select at least one product before generating a routine.",
    });
    saveConversationHistory();
    renderChatHistory();
    return;
  }
  await generateRoutineWithAI(selectedProducts);
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  renderChatHistory();

  try {
    const response = await fetch("https://lorealbot.oosawe.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory,
        max_tokens: 500,
      }),
    });
    const data = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      saveConversationHistory();
      renderChatHistory();
    } else {
      conversationHistory.push({
        role: "assistant",
        content: "Sorry, I couldn't answer your question. Please try again.",
      });
      saveConversationHistory();
      renderChatHistory();
    }
  } catch (error) {
    conversationHistory.push({
      role: "assistant",
      content:
        "Error connecting to OpenAI. Please check your API key and try again.",
    });
    saveConversationHistory();
    renderChatHistory();
  }

  document.getElementById("userInput").value = "";
});

// Optional: Simple Markdown to HTML converter for beginners
function convertMarkdownToHtml(markdown) {
  // Convert **bold** and *italic* and line breaks
  let html = markdown
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  // Convert lists
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");
  return html;
}

// Restore chat history on page load
function restoreChatHistory() {
  const history = loadConversationHistory();
  if (history.length > 0) {
    conversationHistory = history;
    renderChatHistory();
  }
}

/* Store all loaded products for filtering */
let allProducts = [];
let currentCategory = "";
let currentSearch = "";

/* Load products and initialize grid */
async function initializeProducts() {
  allProducts = await loadProducts();
  filterAndDisplayProducts();
}

/* Filter products by category and search keyword */
function filterAndDisplayProducts() {
  let filtered = allProducts;

  // Filter by category if selected
  if (currentCategory) {
    filtered = filtered.filter(
      (product) => product.category === currentCategory
    );
  }

  // Filter by search keyword if entered
  if (currentSearch) {
    const keyword = currentSearch.toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.brand.toLowerCase().includes(keyword) ||
        (product.description &&
          product.description.toLowerCase().includes(keyword))
    );
  }

  displayProducts(filtered);
}

// Listen for category changes
categoryFilter.addEventListener("change", (e) => {
  currentCategory = e.target.value;
  filterAndDisplayProducts();
});

// Listen for search input changes
productSearch.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  filterAndDisplayProducts();
});

/* Restore selections and chat history on page load */
restoreSelectedProducts();
restoreChatHistory();

// Initialize product loading
initializeProducts();
