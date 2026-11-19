// Shared site components: loads the navbar and footer into every page,
// marks the current page in the navbar and wires up the newsletter form.
// Needs a web server (e.g. Live Server) — fetch() does not work on file://.

// Which navbar link is active on each page
const NAV_BY_PAGE = {
  "aboutme.html": "aboutme",
  "contact.html": "contact",
  "portraits.html": "gallery",
  "editorials.html": "gallery",
  "projects.html": "gallery",
};

// Replace a placeholder <div id="..."> with the component's HTML
async function loadComponent(placeholderId, url) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const template = document.createElement("template");
    template.innerHTML = await response.text();
    placeholder.replaceWith(template.content);
  } catch (error) {
    console.error(`Could not load ${url}:`, error);
  }
}

// Navbar: aria-current="page" on the link for the current page
function markCurrentPage() {
  const page = location.pathname.split("/").pop() || "index.html";
  const key = NAV_BY_PAGE[page];
  if (!key) return;
  document.querySelector(`.site-nav [data-nav="${key}"]`)?.setAttribute("aria-current", "page");
}

// Footer: Substack signup confirmation message
function initNewsletter() {
  const form = document.querySelector(".footer-substack__form");
  const message = document.querySelector(".footer-substack__message");
  if (!form || !message) return;

  form.addEventListener("submit", () => {
    form.hidden = true;
    message.textContent = "Almost done — check your inbox to confirm.";
    message.hidden = false;
  });
}

// Galleries: clicking a photo opens it in a Bootstrap modal with the copyright line.
// Only runs on pages that load Bootstrap's JS and have gallery cards.
const LIGHTBOX_HTML = `
  <div class="modal fade lightbox" id="photo-lightbox" tabindex="-1" role="dialog" aria-label="Photo viewer" aria-hidden="true" data-bs-theme="dark">
    <div class="modal-dialog modal-dialog-centered lightbox__dialog">
      <div class="modal-content lightbox__content">
        <button type="button" class="btn-close lightbox__close" data-bs-dismiss="modal" aria-label="Close"></button>
        <figure class="lightbox__figure">
          <img class="lightbox__img" src="" alt="">
          <figcaption class="lightbox__caption">© 2026, Caio Sanfelice, all images are subjected to copyright</figcaption>
        </figure>
      </div>
    </div>
  </div>`;

function initLightbox() {
  // each photo sits in a real <button> in the HTML (keyboard and focus come built in)
  const buttons = document.querySelectorAll(".gallery-grid .gallery-card__button");
  if (!buttons.length || !window.bootstrap) return;

  document.body.insertAdjacentHTML("beforeend", LIGHTBOX_HTML);
  const modalEl = document.getElementById("photo-lightbox");
  const modalImg = modalEl.querySelector(".lightbox__img");
  const modal = new bootstrap.Modal(modalEl);
  let lastButton = null;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const img = button.querySelector("img");
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = img.alt;
      lastButton = button;
      modal.show();
    });
  });

  // back to the photo that was opened, so keyboard users keep their place
  modalEl.addEventListener("hidden.bs.modal", () => lastButton?.focus());
}

initLightbox();

// Galleries: photos fade in as they scroll into view (the look is in style.css, .js-reveal)
function initGalleryReveal() {
  const columns = document.querySelectorAll(".gallery-grid > .col");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!columns.length || reduceMotion || !("IntersectionObserver" in window)) return;

  document.documentElement.classList.add("js-reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target); // reveal once
    });
  }, { rootMargin: "0px 0px -10% 0px" });

  columns.forEach((column) => observer.observe(column));
}

initGalleryReveal();

// Navbar: transparent at the top of the page, dark background once the page scrolls
// (the fixed position itself is Bootstrap's fixed-top, see components/navbar.html)
function initStickyHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  let ticking = false;
  function update() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update); // at most once per frame
    }
  }, { passive: true });

  update(); // page reloaded halfway down: start with the dark navbar
}

Promise.all([
  loadComponent("site-navbar", "components/navbar.html"),
  loadComponent("site-footer", "components/footer.html"),
]).then(() => {
  markCurrentPage();
  initStickyHeader();
  initNewsletter();
});
