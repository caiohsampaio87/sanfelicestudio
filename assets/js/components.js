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
  <div class="modal fade lightbox" id="photo-lightbox" tabindex="-1" aria-label="Photo viewer" aria-hidden="true" data-bs-theme="dark">
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
  const cards = document.querySelectorAll(".grid .card");
  if (!cards.length || !window.bootstrap) return;

  document.body.insertAdjacentHTML("beforeend", LIGHTBOX_HTML);
  const modalEl = document.getElementById("photo-lightbox");
  const modalImg = modalEl.querySelector(".lightbox__img");
  const modal = new bootstrap.Modal(modalEl);
  let lastCard = null;

  function open(card) {
    const img = card.querySelector("img");
    modalImg.src = img.currentSrc || img.src;
    modalImg.alt = img.alt;
    lastCard = card;
    modal.show();
  }

  cards.forEach((card) => {
    // cards act as buttons, so keyboard users can open them too
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `Open photo: ${card.querySelector("img").alt}`);

    card.addEventListener("click", () => open(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open(card);
      }
    });
  });

  // back to the photo that was opened, so keyboard users keep their place
  modalEl.addEventListener("hidden.bs.modal", () => lastCard?.focus());
}

initLightbox();

Promise.all([
  loadComponent("site-navbar", "components/navbar.html"),
  loadComponent("site-footer", "components/footer.html"),
]).then(() => {
  markCurrentPage();
  initNewsletter();
});
