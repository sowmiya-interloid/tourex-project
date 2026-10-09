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

const $ = (id) => document.getElementById(id);

const productGrid = $("productGrid");
const pagination = $("pagination");
const resultText = $("resultText");
const sortDropdown = $("sortDropdown");
const sortCurrent = $("sortCurrent");
const sortLabel = $("sortLabel");
const sortList = sortDropdown.querySelector("ul");
const categoryList = document.querySelector(".product-list-category ul");
const searchInput = document.querySelector(".input-tag-search");

const GRID_CLASS = "grid grid-cols-1 gap-[24px] sm:grid-cols-2 xl:grid-cols-3";

const LIST_CLASS = "grid grid-cols-1 gap-[24px]";

const ACT_BASE =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#fffdfd] p-0 text-[15px] leading-none text-[#393939] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 hover:bg-primary hover:text-white active:bg-primary active:text-white [&>svg]:relative [&>svg]:top-px [&>svg]:block [&>svg]:shrink-0";

const ACT_WISH =
  ACT_BASE +
  " group-hover/c:bg-primary group-hover/c:text-white group-data-[show=true]/c:bg-primary group-data-[show=true]/c:text-white data-[active=true]:bg-primary data-[active=true]:text-white";

const ACT_HIDDEN =
  ACT_BASE +
  " invisible translate-x-3 opacity-0 group-hover/c:visible group-hover/c:translate-x-0 group-hover/c:opacity-100";

const CAT_LI =
  "flex cursor-pointer justify-between border-b border-[#e6e6e6] pb-2.5 pt-[11px] text-[15px] text-body transition-colors duration-300 last:border-b-0 hover:text-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-primary";

const PG_BTN =
  "h-11 min-w-11 cursor-pointer rounded-lg bg-[#f1f3f5] p-0 text-sm font-medium leading-[44px] text-dark enabled:hover:bg-primary enabled:hover:text-white data-[active=true]:bg-primary data-[active=true]:text-white disabled:cursor-default";

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

    productGrid.innerHTML = `
      <p class="col-span-full py-10 text-center">
        Failed to load products
      </p>
    `;

    resultText.textContent = "No Results Found";
  }
}

function renderCategories() {
  const counts = {};

  products.forEach((p) => {
    const name = p.category || "Uncategorized";
    counts[name] = (counts[name] || 0) + 1;
  });

  const rank = (n) => {
    const i = CATEGORY_ORDER.indexOf(n);
    return i === -1 ? 999 : i;
  };

  const names = Object.keys(counts).sort((a, b) => rank(a) - rank(b));

  const items = [[ALL, products.length]].concat(
    names.map((n) => [n, counts[n]]),
  );

  categoryList.innerHTML = items
    .map(
      (item) => `
        <li
          class="${CAT_LI}"
          data-category="${item[0]}"
          tabindex="0"
        >
          <span>${item[0]}</span>
          <span>(${item[1]})</span>
        </li>
      `,
    )
    .join("");
}

function selectCategory(li) {
  if (!li) return;

  currentCategory = li.dataset.category;
  currentPage = 1;

  displayProducts();
}

categoryList.addEventListener("click", (e) =>
  selectCategory(e.target.closest("li")),
);

categoryList.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    selectCategory(e.target.closest("li"));
  }
});

let searchTimer;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    searchText = searchInput.value.trim().toLowerCase();
    currentPage = 1;

    displayProducts();
  }, 2000);
});

const STAR = `
  <svg
    stroke="currentColor"
    fill="currentColor"
    stroke-width="0"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    class="block h-4 w-4"
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z">
    </path>
  </svg>
`;

function createStars(rating) {
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    stars += `
      <span
        class="block h-4 w-4 flex-[0_0_16px] leading-[0] ${
          i <= Math.round(rating) ? "text-[#ffbc0b]" : "text-[#ccc]"
        }"
      >
        ${STAR}
      </span>
    `;
  }

  return stars;
}

function createCard(product, isList) {
  const oldPrice = product.oldPrice
    ? `
      <del class="flex-none text-sm text-[#9a9ca5]">
        $${Number(product.oldPrice).toFixed(2)}
      </del>
    `
    : "";

  return `
    <div
      class="product-card group/c min-w-0 bg-transparent ${
        isList
          ? "flex flex-col gap-5 md:flex-row md:items-center md:gap-[30px]"
          : ""
      }"
      data-id="${product.id}"
      data-show="false"
    >

      <div
        class="product-img relative h-[270px] w-full overflow-hidden rounded-[15px] bg-[#f6f6f8] ${
          isList ? "md:w-[270px] md:shrink-0" : ""
        }"
      >

        <img
          src="${product.image}"
          alt="${product.title}"
          class="block h-[270px] w-full max-w-full rounded-[15px] transition-all duration-300 ease-out group-hover/c:scale-105 group-data-[show=true]/c:scale-105"
        />

        <div
          class="absolute right-[15px] top-[13px] flex flex-col gap-[6px]"
        >

          <button
            class="${ACT_WISH}"
            data-action="wish"
            data-active="${wishlist.has(product.id)}"
            aria-label="Wishlist"
          >
            <svg
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
            >
              <path
                d="M15.96 2.2377C15.5678 1.84531 15.1022 1.53404 14.5896 1.32168C14.0771 1.10931 13.5277 1 12.973 1C12.4182 1 11.8688 1.10931 11.3563 1.32168C10.8437 1.53404 10.3781 1.84531 9.98587 2.2377L9.17191 3.05166L8.35794 2.2377C7.56572 1.44548 6.49123 1.00041 5.37086 1.00041C4.25049 1.00041 3.176 1.44548 2.38378 2.2377C1.59155 3.02993 1.14648 4.10441 1.14648 5.22479C1.14648 6.34516 1.59155 7.41965 2.38378 8.21187L9.17191 15L15.96 8.21187C16.3524 7.81967 16.6637 7.354 16.8761 6.84146C17.0884 6.32893 17.1977 5.77958 17.1977 5.22479C17.1977 4.67 17.0884 4.12064 16.8761 3.60811C16.6637 3.09558 16.3521 2.6299 15.96 2.2377Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
              </path>
            </svg>
          </button>

          <button
            class="${ACT_HIDDEN}"
            data-action="cart"
            aria-label="Add to cart"
          >
            <svg
              width="16"
              height="18"
              viewBox="0 0 16 18"
              fill="none"
            >
              <path
                d="M0.799805 4.2L3.1998 1H12.7998L15.1998 4.2M0.799805 4.2V15.4C0.799805 15.8243 0.968376 16.2313 1.26843 16.5314C1.56849 16.8314 1.97546 17 2.3998 17H13.5998C14.0242 17 14.4311 16.8314 14.7312 16.5314C15.0312 16.2313 15.1998 15.8243 15.1998 15.4V4.2M0.799805 4.2H15.1998M11.1998 7.4C11.1998 8.24869 10.8627 9.06263 10.2625 9.66274C9.66243 10.2629 8.8485 10.6 7.9998 10.6C7.15111 10.6 6.33718 10.2629 5.73706 9.66274C5.13695 9.06263 4.7998 8.24869 4.7998 7.4"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
              </path>
            </svg>
          </button>

          <button
            class="${ACT_HIDDEN}"
            data-action="compare"
            aria-label="Compare"
          >
            <svg
              width="15"
              height="16"
              viewBox="0 0 15 16"
              fill="none"
            >
              <path
                d="M10.222 1H14.1109M14.1109 1V4.88889M14.1109 1L0.888672 14.2222M14.1109 11.1111V15M14.1109 15H10.222M14.1109 15L9.44423 10.3333M0.888672 1.77778L4.77756 5.66667"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
              </path>
            </svg>
          </button>

        </div>
      </div>

      <div
        class="pb-0.5 pt-[14px] ${isList ? "md:p-0" : ""}"
      >

        <h4
          class="relative mb-2 text-base font-medium capitalize leading-[1.2] text-dark"
        >
          ${product.title}
        </h4>

        <div
          class="mb-1 flex h-[26px] flex-nowrap items-center whitespace-nowrap"
        >
          <div
            class="relative ml-[9px] flex flex-none pt-[4px]"
          >
            ${createStars(product.rating)}
          </div>

          <span
            class="relative -top-px ml-[3px] flex-none pt-[1px] text-sm leading-[26px] text-body"
          >
            (${product.review})
          </span>
        </div>

        <div
          class="relative flex h-[26px] items-center whitespace-nowrap leading-[26px]"
        >
          <span
            class="flex-none text-[18px] font-semibold leading-[26px] text-primary"
          >
            $${Number(product.price).toFixed(2)}
          </span>

          ${oldPrice}
        </div>

        ${
          isList && product.description
            ? `
              <p class="mt-2.5 text-[15px] text-body">
                ${product.description}
              </p>
            `
            : ""
        }

      </div>

    </div>
  `;
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    const tapped = event.target.closest("[data-id]");

    productGrid.querySelectorAll('[data-show="true"]').forEach((c) => {
      if (c !== tapped) {
        c.dataset.show = "false";
      }
    });

    if (tapped && event.target.closest(".product-img")) {
      tapped.dataset.show = tapped.dataset.show === "true" ? "false" : "true";
    }

    return;
  }

  const card = button.closest("[data-id]");
  const id = Number(card.dataset.id);

  if (button.dataset.action === "wish") {
    wishlist.has(id) ? wishlist.delete(id) : wishlist.add(id);

    button.dataset.active = wishlist.has(id);
  }

  if (button.dataset.action === "cart") {
    cartCount++;

    document
      .querySelectorAll(".cart-count")
      .forEach((b) => (b.textContent = cartCount));
  }
});

function getVisibleProducts() {
  let list = products.filter((p) => {
    const matchCategory =
      currentCategory === ALL || p.category === currentCategory;

    const matchSearch =
      searchText === "" || p.title.toLowerCase().includes(searchText);

    return matchCategory && matchSearch;
  });

  if (currentSort === "price") {
    list.sort((a, b) => a.price - b.price);
  }

  if (currentSort === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  }

  if (currentSort === "offers") {
    list.sort(
      (a, b) =>
        (b.oldPrice ? b.oldPrice - b.price : 0) -
        (a.oldPrice ? a.oldPrice - a.price : 0),
    );
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

  const isList = currentView === "list";

  resultText.textContent =
    totalProducts === 0
      ? "No Results Found"
      : `Showing ${start + 1}-${end} of ${totalProducts} Results`;

  productGrid.className = isList ? LIST_CLASS : GRID_CLASS;

  productGrid.innerHTML =
    totalProducts === 0
      ? `
        <p class="col-span-full py-10 text-center">
          No products found
        </p>
      `
      : list
          .slice(start, end)
          .map((p) => createCard(p, isList))
          .join("");

  createPagination(totalPages);
}

function createPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let html = `
    <li class="mb-[5px] mr-[25px]">
      <button
        class="${PG_BTN} flex items-center justify-center px-[30px] py-[15px] text-sm italic"
        data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}
      >
        Previous Page
      </button>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="mb-[5px] mr-[5px]">
        <button
          class="${PG_BTN}"
          data-active="${currentPage === i}"
          data-page="${i}"
        >
          ${i}
        </button>
      </li>
    `;
  }

  html += `
    <li class="mb-[5px] ml-[25px] mr-[5px]">
      <button
        class="${PG_BTN} flex items-center justify-center px-[30px] py-[15px] text-sm italic"
        data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        Next Page
      </button>
    </li>
  `;

  pagination.innerHTML = html;
}

pagination.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button || button.disabled) return;

  currentPage = Number(button.dataset.page);

  displayProducts();
});

function openSort(open) {
  sortDropdown.dataset.open = open;

  sortCurrent.setAttribute("aria-expanded", open);
}

sortCurrent.addEventListener("click", (e) => {
  e.stopPropagation();

  openSort(sortDropdown.dataset.open !== "true");
});

sortList.addEventListener("click", (e) => {
  const li = e.target.closest("li");

  if (!li) return;

  currentSort = li.dataset.value;
  currentPage = 1;

  sortLabel.textContent = li.textContent;

  sortList
    .querySelectorAll("li")
    .forEach((item) => (item.dataset.selected = item === li));

  openSort(false);

  displayProducts();
});

document.addEventListener("click", () => openSort(false));

const viewButtons = document.querySelectorAll(".view-btn, .view-btn1");

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;

    viewButtons.forEach((b) => (b.dataset.active = b === button));

    displayProducts();
  });
});

const headerArea = document.querySelector(".header-area");

const headerLogo = headerArea.querySelector(".white-logo img");

const backToTop = $("backToTop");

const LOGO_LIGHT = "tourex_image/logo_header.webp";

const LOGO_DARK = "tourex_image/logo_dark.webp";

const STICKY_AT = 250;

new Image().src = LOGO_DARK;

function onPageScroll() {
  const scrolled = window.scrollY > STICKY_AT;

  if (String(scrolled) !== headerArea.dataset.sticky) {
    headerArea.dataset.sticky = scrolled;

    headerLogo.src = scrolled ? LOGO_DARK : LOGO_LIGHT;
  }

  backToTop.dataset.show = scrolled;
}

window.addEventListener("scroll", onPageScroll, { passive: true });

onPageScroll();

backToTop.addEventListener("click", () =>
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  }),
);

const overlay = $("offcanvasOverlay");
const mobileMenu = $("mobileMenu");
const infoPanel = $("infoPanel");

function closePanels() {
  [mobileMenu, infoPanel].forEach((panel) => {
    panel.dataset.open = "false";

    panel.setAttribute("aria-hidden", "true");
  });

  overlay.dataset.show = "false";
}

function openPanel(panel) {
  closePanels();

  panel.dataset.open = "true";

  panel.setAttribute("aria-hidden", "false");

  overlay.dataset.show = "true";
}

document
  .querySelector(".mobile-menu-button")
  .addEventListener("click", () => openPanel(mobileMenu));

document
  .querySelector(".desktop-menu-button")
  .addEventListener("click", () => openPanel(infoPanel));

overlay.addEventListener("click", closePanels);

document
  .querySelectorAll("[data-close]")
  .forEach((b) => b.addEventListener("click", closePanels));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    openSort(false);
    closePanels();
  }
});

window
  .matchMedia("(min-width: 1200px)")
  .addEventListener("change", closePanels);

function initMobileAccordion() {
  document.querySelectorAll(".mobile-has-sub").forEach((item) => {
    const row = item.querySelector(".mobile-row");

    const sub = item.querySelector(".mobile-sub");

    row.addEventListener("click", (event) => {
      event.preventDefault();

      const willOpen = item.dataset.open !== "true";

      document.querySelectorAll(".mobile-has-sub").forEach((o) => {
        o.dataset.open = "false";

        o.querySelector(".mobile-sub").style.maxHeight = null;
      });

      if (willOpen) {
        item.dataset.open = "true";

        sub.style.maxHeight = sub.scrollHeight + "px";
      }
    });
  });
}

initMobileAccordion();

loadProducts();
