// Hero background video (Home and gallery pages): starts the video with the VHS effect (no glitch)
// (vhs-glitch-bg.js) and wires the pause / play button.
// With "reduce motion" on, nothing plays: the still poster stays and the button is not shown.

(function () {
  const video = document.querySelector(".hero__video");
  const button = document.querySelector(".hero-pause");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let fx = null;

  function start() {
    video.preload = "auto";
    // uGlitch: 0 = calm video, no glitch blocks; the VHS noise, lines and tracking stay
    fx = window.VhsGlitch ? window.VhsGlitch(video, { uGlitch: 0 }) : null; // also starts the video
    if (!fx) video.play().catch(() => {}); // no WebGL: plain video
    if (button) button.hidden = false;
  }

  // Start only after the page has loaded and the browser is idle, so the WebGL setup
  // doesn't compete with the first paint (the poster image shows until then)
  whenIdleAfterLoad(start);

  if (!button) return;

  button.addEventListener("click", () => {
    const pause = button.getAttribute("aria-pressed") !== "true";
    if (pause) {
      video.pause();
      fx?.pause();
    } else {
      video.play().catch(() => {});
      fx?.resume();
    }
    button.setAttribute("aria-pressed", String(pause));
  });

  function whenIdleAfterLoad(callback) {
    const idle = () => ("requestIdleCallback" in window
      ? window.requestIdleCallback(callback, { timeout: 2000 })
      : window.setTimeout(callback, 300));
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }
})();
