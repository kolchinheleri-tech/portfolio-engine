import {
  getProductBySlug,
  formatProductPrice
} from "./product-data.js";


function getCart() {
  try {
    const raw =
      window.localStorage
        .getItem(
          "portfolio-shop-cart"
        );

    const parsed =
      JSON.parse(
        raw || "[]"
      );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function saveCart(cart) {
  window.localStorage.setItem(
    "portfolio-shop-cart",
    JSON.stringify(cart)
  );

  updateCartCount();
}


function updateCartCount() {
  const cart =
    getCart();

  const count =
    document.getElementById(
      "cart-count"
    );

  if (count) {
    count.textContent =
      String(cart.length);
  }
}


function addProductToCart(
  product
) {
  const cart =
    getCart();

  cart.push({
    productId:
      product.id,

    quantity: 1,

    addedAt:
      new Date()
        .toISOString()
  });

  saveCart(cart);

  const status =
    document.getElementById(
      "cart-status"
    );

  if (status) {
    status.textContent =
      "Added to cart";

    window.setTimeout(
      () => {
        status.textContent =
          "";
      },
      2000
    );
  }
}


function renderProduct(
  product
) {
  document.title =
    `${product.title} — Exhibition`;

  document.getElementById(
    "product-title"
  ).textContent =
    product.title;

  document.getElementById(
    "product-subtitle"
  ).textContent =
    product.subtitle;

  document.getElementById(
    "product-year"
  ).textContent =
    product.year;

  document.getElementById(
    "product-price"
  ).textContent =
    formatProductPrice(
      product
    );

  document.getElementById(
    "product-materials"
  ).textContent =
    product.materials;

  document.getElementById(
    "product-dimensions"
  ).textContent =
    product.dimensions;

  document.getElementById(
    "product-availability"
  ).textContent =
    product.availability;

  document.getElementById(
    "product-edition"
  ).textContent =
    product.edition;

  const description =
    document.getElementById(
      "product-description"
    );

  product.description.forEach(
    (paragraph) => {
      const element =
        document.createElement(
          "p"
        );

      element.textContent =
        paragraph;

      description.appendChild(
        element
      );
    }
  );

  const details =
    document.getElementById(
      "product-details"
    );

  product.details.forEach(
    (detail) => {
      const item =
        document.createElement(
          "li"
        );

      item.textContent =
        detail;

      details.appendChild(
        item
      );
    }
  );

  document.getElementById(
    "product-shipping"
  ).textContent =
    product.shipping;

  document.getElementById(
    "add-to-cart"
  ).addEventListener(
    "click",
    () => {
      addProductToCart(
        product
      );
    }
  );

  document.getElementById(
    "product-status"
  ).hidden =
    true;

  document.getElementById(
    "product-content"
  ).hidden =
    false;
}


function init() {
  updateCartCount();

  const parameters =
    new URLSearchParams(
      window.location.search
    );

  const slug =
    parameters.get(
      "product"
    );

  const product =
    getProductBySlug(
      slug
    );

  if (!product) {
    document.getElementById(
      "product-status"
    ).textContent =
      "Product not found.";

    return;
  }

  renderProduct(
    product
  );
}


init();
