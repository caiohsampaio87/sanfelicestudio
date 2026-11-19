// Hero background video (Home and gallery pages): starts the video with the VHS effect (no glitch)
// (vhs-glitch-bg.js) and wires the pause / play button.
// With "reduce motion" on, nothing plays: the still poster stays and the button is not shown.

(function () {
  const video = document.querySelector(".hero__video");
  const button = document.querySelector(".hero-pause");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  video.preload = "auto";
  // uGlitch: 0 = calm video, no glitch blocks; the VHS noise, lines and tracking stay
  const fx = window.VhsGlitch ? window.VhsGlitch(video, { uGlitch: 0 }) : null; // also starts the video
  if (!fx) video.play().catch(() => {}); // no WebGL: plain video

  if (!button) return;
  button.hidden = false;

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
})();
