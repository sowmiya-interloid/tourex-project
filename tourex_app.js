const PER_PAGE = 9;

const CATEGORY_ORDER = [
  "Activity",
  "Destinations",
  "Beach Tour",
  "City Tour",
  "Flight",
  "Lifestyle",
];

const ALL = "All Category";

let products = [];
let currentPage = 1;
let currentView = "grid";
let currentSort = "default";
let currentCategory = ALL;
let searchText = "";

const wishlist = new Set();
let cartCount = 0;

const productGrid = document.getElementById("productGrid");
const pagination = document.getElementById("pagination");
const resultText = document.getElementById("resultText");
const sortDropdown = document.getElementById("sortDropdown");
const sortCurrent = document.getElementById("sortCurrent");
const sortLabel = document.getElementById("sortLabel");
const sortList = sortDropdown.querySelector(".sort-list");
const categoryList = document.querySelector(".product-list-category ul");
const searchInput = document.querySelector(".input-tag-search");

async function loadProducts() {
  try {
    const response = await fetch("products.json");

    if (!response.ok) {
      throw new Error("Products not found");
    }

    products = await response.json();

    renderCategories();
    displayProducts();
  } catch (error) {
    console.log(error);

    productGrid.innerHTML = `<p class="no-result">Failed to load products</p>`;
    resultText.textContent = "No Results Found";
  }
}

/* ================= CATEGORIES ================= */

function renderCategories() {
  const counts = {};

  products.forEach(function (product) {
    const name = product.category || "Uncategorized";
    counts[name] = (counts[name] || 0) + 1;
  });

  function rank(name) {
    const index = CATEGORY_ORDER.indexOf(name);
    return index === -1 ? 999 : index;
  }

  const names = Object.keys(counts).sort(function (a, b) {
    return rank(a) - rank(b);
  });

  const items = [[ALL, products.length]].concat(
    names.map(function (name) {
      return [name, counts[name]];
    }),
  );

  categoryList.innerHTML = items
    .map(function (item) {
      return `
        <li
          class="${item[0] === currentCategory ? "active" : ""}"
          data-category="${item[0]}"
          tabindex="0"
        >
          <span>${item[0]}</span>
          <span>(${item[1]})</span>
        </li>
      `;
    })
    .join("");
}

function selectCategory(li) {
  if (!li) return;

  currentCategory = li.dataset.category;
  currentPage = 1;

  categoryList.querySelectorAll("li").forEach(function (item) {
    item.classList.toggle("active", item === li);
  });

  displayProducts();
}

categoryList.addEventListener("click", function (event) {
  selectCategory(event.target.closest("li"));
});

categoryList.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectCategory(event.target.closest("li"));
  }
});

/* ================= SEARCH ================= */

searchInput.addEventListener("input", function () {
  searchText = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  displayProducts();
});

/* ================= CARDS ================= */

const STAR = `<svg class="star-svg" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>`;

function createStars(rating) {
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    stars += `<span class="${i <= Math.round(rating) ? "on" : ""}">${STAR}</span>`;
  }

  return stars;
}

function createCard(product) {
  const oldPrice = product.oldPrice
    ? `<del>$${Number(product.oldPrice).toFixed(2)}</del>`
    : "";

  return `
    <div class="product-card" data-id="${product.id}">

      <div class="product-img">

        <img src="${product.image}" alt="${product.title}">

        <div class="card-actions">

          <button class="act-btn wish ${wishlist.has(product.id) ? "active" : ""}" data-action="wish" aria-label="Wishlist">
            <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.96 2.2377C15.5678 1.84531 15.1022 1.53404 14.5896 1.32168C14.0771 1.10931 13.5277 1 12.973 1C12.4182 1 11.8688 1.10931 11.3563 1.32168C10.8437 1.53404 10.3781 1.84531 9.98587 2.2377L9.17191 3.05166L8.35794 2.2377C7.56572 1.44548 6.49123 1.00041 5.37086 1.00041C4.25049 1.00041 3.176 1.44548 2.38378 2.2377C1.59155 3.02993 1.14648 4.10441 1.14648 5.22479C1.14648 6.34516 1.59155 7.41965 2.38378 8.21187L9.17191 15L15.96 8.21187C16.3524 7.81967 16.6637 7.354 16.8761 6.84146C17.0884 6.32893 17.1977 5.77958 17.1977 5.22479C17.1977 4.67 17.0884 4.12064 16.8761 3.60811C16.6637 3.09558 16.3524 2.6299 15.96 2.2377Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </button>

          <button class="act-btn" data-action="cart" aria-label="Add to cart">
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.799805 4.2L3.1998 1H12.7998L15.1998 4.2M0.799805 4.2V15.4C0.799805 15.8243 0.968376 16.2313 1.26843 16.5314C1.56849 16.8314 1.97546 17 2.3998 17H13.5998C14.0242 17 14.4311 16.8314 14.7312 16.5314C15.0312 16.2313 15.1998 15.8243 15.1998 15.4V4.2M0.799805 4.2H15.1998M11.1998 7.4C11.1998 8.24869 10.8627 9.06263 10.2625 9.66274C9.66243 10.2629 8.8485 10.6 7.9998 10.6C7.15111 10.6 6.33718 10.2629 5.73706 9.66274C5.13695 9.06263 4.7998 8.24869 4.7998 7.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </button>

          <button class="act-btn" data-action="compare" aria-label="Compare">
            <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.222 1H14.1109M14.1109 1V4.88889M14.1109 1L0.888672 14.2222M14.1109 11.1111V15M14.1109 15H10.222M14.1109 15L9.44423 10.3333M0.888672 1.77778L4.77756 5.66667" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </button>

        </div>

      </div>

      <div class="product-info">

        <h4>${product.title}</h4>

        <div class="rating-row">
          <div class="product-ratings">${createStars(product.rating)}</div>
          <span class="reviews">(${product.review})</span>
        </div>

        <div class="product-price">
          <span class="price">$${Number(product.price).toFixed(2)}</span>
          ${oldPrice}
        </div>

        ${product.description ? `<p class="product-desc">${product.description}</p>` : ""}

      </div>

    </div>
  `;
}

productGrid.addEventListener("click", function (event) {
  const button = event.target.closest(".act-btn");

  if (!button) {
    const tapped = event.target.closest(".product-card");

    productGrid
      .querySelectorAll(".product-card.show-actions")
      .forEach(function (c) {
        if (c !== tapped) c.classList.remove("show-actions");
      });

    if (tapped && event.target.closest(".product-img")) {
      tapped.classList.toggle("show-actions");
    }

    return;
  }

  const card = button.closest(".product-card");
  const id = Number(card.dataset.id);

  
  if (button.dataset.action === "wish") {
    if (wishlist.has(id)) {
      wishlist.delete(id);
    } else {
      wishlist.add(id);
    }

    button.classList.toggle("active", wishlist.has(id));
  }


  if (button.dataset.action === "cart") {
    cartCount++;

    document.querySelectorAll(".cart-count").forEach(function (badge) {
      badge.textContent = cartCount;
    });
  }
});

function getVisibleProducts() {
  let list = products.filter(function (product) {
    const matchCategory =
      currentCategory === ALL || product.category === currentCategory;

    const matchSearch =
      searchText === "" || product.title.toLowerCase().includes(searchText);

    return matchCategory && matchSearch;
  });

  if (currentSort === "price") {
    list.sort(function (a, b) {
      return a.price - b.price;
    });
  }

  if (currentSort === "rating") {
    list.sort(function (a, b) {
      return b.rating - a.rating;
    });
  }

  if (currentSort === "offers") {
    list.sort(function (a, b) {
      return (
        (b.oldPrice ? b.oldPrice - b.price : 0) -
        (a.oldPrice ? a.oldPrice - a.price : 0)
      );
    });
  }

  return list;
}

function displayProducts() {
  const list = getVisibleProducts();

  const totalProducts = list.length;
  const totalPages = Math.ceil(totalProducts / PER_PAGE);

  if (currentPage > totalPages) {
    currentPage = Math.max(totalPages, 1);
  }

  const start = (currentPage - 1) * PER_PAGE;
  const end = Math.min(start + PER_PAGE, totalProducts);

  resultText.textContent =
    totalProducts === 0
      ? "No Results Found"
      : `Showing ${start + 1}-${end} of ${totalProducts} Results`;

  productGrid.classList.toggle("list-view", currentView === "list");

  productGrid.innerHTML =
    totalProducts === 0
      ? `<p class="no-result">No products found</p>`
      : list.slice(start, end).map(createCard).join("");

  createPagination(totalPages);
}

function createPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let html = `
    <li>
      <button class="pg-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>
        Previous Page
      </button>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li>
        <button data-page="${i}" class="${currentPage === i ? "active" : ""}">${i}</button>
      </li>
    `;
  }

  html += `
    <li>
      <button class="pg-nav" id="page-nav"  data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>
        Next Page
      </button>
    </li>
  `;

  pagination.innerHTML = html;
}

pagination.addEventListener("click", function (event) {
  const button = event.target.closest("button");

  if (!button || button.disabled) return;

  currentPage = Number(button.dataset.page);
  displayProducts();
});

function openSort(open) {
  sortDropdown.classList.toggle("open", open);
  sortCurrent.setAttribute("aria-expanded", open);
}

sortCurrent.addEventListener("click", function (event) {
  event.stopPropagation();
  openSort(!sortDropdown.classList.contains("open"));
});

sortList.addEventListener("click", function (event) {
  const li = event.target.closest("li");

  if (!li) return;

  currentSort = li.dataset.value;
  currentPage = 1;

  sortLabel.textContent = li.textContent;

  sortList.querySelectorAll("li").forEach(function (item) {
    item.classList.toggle("selected", item === li);
  });

  openSort(false);
  displayProducts();
});

document.addEventListener("click", function () {
  openSort(false);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") openSort(false);
});



const viewButtons = document.querySelectorAll(".view-btn");

viewButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentView = button.dataset.view;

    viewButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    displayProducts();
  });
});

loadProducts();



const headerArea = document.querySelector(".header-area");
const headerLogo = headerArea.querySelector(".white-logo img");
const backToTop = document.getElementById("backToTop");

const LOGO_LIGHT = "tourex_image/logo_header.webp";
const LOGO_DARK = "tourex_image/logo_dark.webp";
const STICKY_AT = 250;

new Image().src = LOGO_DARK; 

function onPageScroll() {
  const scrolled = window.scrollY > STICKY_AT;

  if (scrolled !== headerArea.classList.contains("sticky")) {
    headerArea.classList.toggle("sticky", scrolled);
    headerLogo.src = scrolled ? LOGO_DARK : LOGO_LIGHT;
  }

  backToTop.classList.toggle("show", scrolled);
}

window.addEventListener("scroll", onPageScroll, { passive: true });
onPageScroll();

backToTop.addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const overlay = document.getElementById("offcanvasOverlay");
const mobileMenu = document.getElementById("mobileMenu");
const infoPanel = document.getElementById("infoPanel");

function closePanels() {
  [mobileMenu, infoPanel].forEach(function (panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  });

  overlay.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function openPanel(panel) {
  closePanels();
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
}

document
  .querySelector(".mobile-menu-button")
  .addEventListener("click", function () {
    openPanel(mobileMenu);
  });

document
  .querySelector(".desktop-menu-button")
  .addEventListener("click", function () {
    openPanel(infoPanel);
  });

overlay.addEventListener("click", closePanels);

document.querySelectorAll("[data-close]").forEach(function (btn) {
  btn.addEventListener("click", closePanels);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closePanels();
});


window
  .matchMedia("(min-width: 1200px)")
  .addEventListener("change", closePanels);



document.querySelectorAll(".mobile-has-sub").forEach(function (item) {
  const row = item.querySelector(".mobile-row");
  const sub = item.querySelector(".mobile-sub");

  row.addEventListener("click", function (event) {
    event.preventDefault();

    const willOpen = !item.classList.contains("open");

    document.querySelectorAll(".mobile-has-sub.open").forEach(function (o) {
      o.classList.remove("open");
      o.querySelector(".mobile-sub").style.maxHeight = null;
    });

    if (willOpen) {
      item.classList.add("open");
      sub.style.maxHeight = sub.scrollHeight + "px";
    }
  });
});