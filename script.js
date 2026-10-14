
/*
  HOME-MADE-CRAFT
  Gmail enquiry instead of WhatsApp.
  Replace SELLER_EMAIL with your business Gmail address.
  Existing design and Supabase product loading are preserved.
*/

const SELLER_EMAIL = "haterchoyasutarsapna@gmail.com";

const sampleProducts = [
  {
    id: 1, name: "Jute Tote Bag", category: "Accessories", price: 299,
    description: "A reusable jute tote with a cheerful handmade design. A lovely companion for shopping, college or gifting.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
    tag: "BESTSELLER"
  },
  {
    id: 2, name: "Macrame Wall Hanging", category: "Home Decor", price: 499,
    description: "A soft, hand-knotted wall hanging that adds a warm, bohemian touch to your favourite corner.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
    tag: "HAND-KNOTTED"
  },
  {
    id: 3, name: "Handmade Clay Earrings", category: "Jewellery", price: 199,
    description: "Lightweight statement earrings with colourful artisan-inspired details. Each pair may have its own unique finish.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
    tag: "ONE OF A KIND"
  },
  {
    id: 4, name: "Wooden Elephant Keychain", category: "Gifts", price: 149,
    description: "A small wooden keepsake for your keys, bag or as a thoughtful little gift for someone special.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=85",
    tag: "GIFT PICK"
  },
  {
    id: 5, name: "Crochet Plant Pot Cover", category: "Home Decor", price: 349,
    description: "A cosy crochet cover that gives a simple plant pot a handmade, homely look. Check pot sizing with the seller.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85",
    tag: "MADE WITH CARE"
  },
  {
    id: 6, name: "Beaded Bracelet", category: "Jewellery", price: 179,
    description: "A colourful handmade bracelet that works beautifully as a small gift or an everyday accessory.",
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
    tag: "HANDMADE"
  },
  {
    id: 7, name: "Hand-Painted Gift Box", category: "Gifts", price: 249,
    description: "A decorative gift box for small keepsakes, celebrations and personal surprises. Ask about custom colours.",
    image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85",
    tag: "GIFT READY"
  },
  {
    id: 8, name: "Decorative Ceramic Vase", category: "Home Decor", price: 399,
    description: "A charming decorative vase to style a shelf, desk or bedside table. Please confirm availability before ordering.",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85",
    tag: "POPULAR"
  }
];

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalPrice = document.getElementById("modalPrice");
const modalDescription = document.getElementById("modalDescription");
const modalWhatsApp = document.getElementById("modalWhatsApp");
const modalCall = document.getElementById("modalCall");

// Gmail enquiry link
function emailLink(subject, body = "") {
  return `mailto:${SELLER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

let products = sampleProducts;
let usingOnlineProducts = false;

async function loadOnlineProducts() {
  const configured =
    window.SUPABASE_URL &&
    window.SUPABASE_PUBLISHABLE_KEY &&
    !window.SUPABASE_URL.includes("PASTE_") &&
    !window.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_") &&
    window.supabase;

  if (!configured) {
    renderProducts(
      document.querySelector(".filter.active")?.dataset.category || "All"
    );
    return;
  }

  try {
    const client = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_PUBLISHABLE_KEY
    );

    const { data, error } = await client
      .from("products")
      .select("id,name,price,category,description,image_url,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    products = data.map(product => ({
      ...product,
      image: product.image_url,
      tag: "HANDMADE"
    }));

    usingOnlineProducts = true;

    renderProducts(
      document.querySelector(".filter.active")?.dataset.category || "All"
    );
  } catch (error) {
    console.error("Could not load online products:", error);
    productGrid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent =
      "Products could not be loaded right now. Please try again later.";
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderProducts(category = "All") {
  const filtered =
    category === "All"
      ? products
      : products.filter(product => product.category === category);

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card" tabindex="0" role="button"
      aria-label="View ${escapeHTML(product.name)} details"
      data-id="${escapeHTML(product.id)}">
      <div class="product-image-wrap">
        <img class="product-image"
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}" loading="lazy">
        <span class="product-tag">${escapeHTML(product.tag)}</span>
      </div>
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.category)} · Handmade with care</p>
        <div class="product-bottom">
          <span class="product-price">₹${Number(product.price).toLocaleString("en-IN")}</span>
          <button class="view-button" type="button"
            data-id="${escapeHTML(product.id)}">View & DM ↗</button>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filtered.length > 0;
}

function openProduct(id) {
  const product = products.find(
    item => String(item.id) === String(id)
  );

  if (!product) return;

  modalImage.src = product.image;
  modalImage.alt = product.name;
  modalTitle.textContent = product.name;
  modalCategory.textContent = product.category;
  modalPrice.textContent =
    `₹${Number(product.price).toLocaleString("en-IN")}`;
  modalDescription.textContent =
    product.description || "Handmade with care.";

  // Gmail replaces WhatsApp for product enquiries.
  modalWhatsApp.href = emailLink(
    `Product Enquiry: ${product.name}`,
    `Hello, I am interested in "${product.name}" (₹${product.price}). Is it available? Please share ordering and delivery details.`
  );

  // Keep the existing call button functionality.
  // Remove this line only if the HTML no longer has modalCall.
  if (modalCall) {
    modalCall.href = `mailto:${SELLER_EMAIL}?subject=${encodeURIComponent(
      `Contact about ${product.name}`
    )}`;
  }

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("modalClose").focus();
}

function closeProduct() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  document.querySelectorAll(".filter").forEach(filter => {
    filter.classList.toggle("active", filter === button);
  });

  renderProducts(button.dataset.category);
});

productGrid.addEventListener("click", event => {
  const card = event.target.closest("[data-id]");
  if (card) openProduct(card.dataset.id);
});

productGrid.addEventListener("keydown", event => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.classList.contains("product-card")
  ) {
    event.preventDefault();
    openProduct(event.target.dataset.id);
  }
});

document.getElementById("modalClose").addEventListener("click", closeProduct);

modal.addEventListener("click", event => {
  if (event.target === modal) closeProduct();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) closeProduct();
});

// Gmail replaces the general WhatsApp enquiry.
const generalEnquiry = document.getElementById("generalWhatsApp");

if (generalEnquiry) {
  generalEnquiry.href = emailLink(
    "Handmade Crafts Enquiry",
    "Hello! I would like to know more about your handmade crafts."
  );
}

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Load shared online products after the page is ready.
loadOnlineProducts();
