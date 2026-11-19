// Hero title ("Sanfelice Studio"): a soft wobble while the hero scrolls out of view.
// It starts straight, tilts -6deg, +6deg, -3deg and settles back, while it shrinks and
// fades a little. Stops wherever the scroll stops. Off for users who ask for less motion.

(function () {
  const hero = document.querySelector(".hero");
  const title = hero?.querySelector(".hero__title");
  if (!title || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // [scroll progress through the hero, angle in degrees]
  const keys = [[0, 0], [0.25, -6], [0.5, 6], [0.75, -3], [1, 0]];

  function angleAt(progress) {
    for (let i = 1; i < keys.length; i++) {
      if (progress <= keys[i][0]) {
        const [p0, a0] = keys[i - 1];
        const [p1, a1] = keys[i];
        return a0 + (a1 - a0) * ((progress - p0) / (p1 - p0));
      }
    }
    return 0;
  }

  let lastProgress = -1;
  let ticking = false;

  function update() {
    ticking = false;
    const progress = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
    if (progress === lastProgress) return; // hero already gone: nothing to do
    lastProgress = progress;
    title.style.transform = `rotate(${angleAt(progress)}deg) scale(${1 - progress * 0.12})`;
    title.style.opacity = String(1 - progress * 0.6);
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update); // at most once per frame
    }
  }, { passive: true });

  update(); // page reloaded halfway down
})();
