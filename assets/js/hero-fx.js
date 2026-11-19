// Home hero: background video + analog camera look on top of it (WebGL).
// Film grain, scanlines, a slight RGB split, flicker and random glitch bursts.
// One place controls both: with "reduce motion" on, the video stays paused on its poster
// and no effect is drawn; it reacts if the setting changes while the page is open.
// If WebGL is not available the plain video plays.

(function () {
  const hero = document.querySelector(".hero");
  const video = hero?.querySelector(".hero__video");
  const canvas = hero?.querySelector(".hero__fx");
  if (!video) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fx = canvas ? createEffect() : null;

  function sync() {
    if (reduceMotion.matches) {
      fx?.stop();
      if (!video.paused || video.currentTime > 0) {
        video.pause();
        video.load(); // back to the poster image, not a frozen video frame
      }
    } else {
      video.preload = "auto";
      video.play().catch(() => {}); // autoplay can be blocked; the poster stays then
    }
  }

  // the effect runs only while the video is actually playing
  video.addEventListener("playing", () => fx?.start());
  video.addEventListener("pause", () => fx?.stop());

  sync();
  reduceMotion.addEventListener("change", sync);

  function createEffect() {
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return null;

    // ---- Tweak the look here ----
    const SETTINGS = {
      grain: 0.09,        // film grain strength
      scanlines: 0.07,    // dark line strength
      rgbSplit: 0.0018,   // constant colour fringing
      flicker: 0.035,     // brightness flicker
      vignette: 0.35,     // darker corners
      glitchEveryMin: 1.6, // seconds between glitch bursts (min / max)
      glitchEveryMax: 4.5,
    };

    const VERTEX = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }`;

    const FRAGMENT = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec2 u_res;      // canvas size in pixels
      uniform vec2 u_vid;      // video size in pixels
      uniform float u_time;
      uniform float u_glitch;  // 0 = calm, 1 = full glitch
      uniform float u_seed;    // changes during a glitch so bands jump around
      uniform float u_grain;
      uniform float u_scan;
      uniform float u_split;
      uniform float u_flicker;
      uniform float u_vignette;

      float rand(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

      void main() {
        // cover-fit the video into the canvas (like object-fit: cover)
        float canvasAspect = u_res.x / u_res.y;
        float videoAspect = u_vid.x / u_vid.y;
        vec2 scale = canvasAspect > videoAspect ? vec2(1.0, videoAspect / canvasAspect) : vec2(canvasAspect / videoAspect, 1.0);
        vec2 uv = (v_uv - 0.5) * scale + 0.5;

        // tiny constant line jitter, like a worn tape
        float line = floor(v_uv.y * u_res.y / 2.0);
        uv.x += (rand(vec2(line, floor(u_time * 24.0))) - 0.5) * 0.0012;

        // glitch: horizontal bands shift sideways
        float bands = mix(6.0, 36.0, rand(vec2(u_seed, 1.7)));
        float band = floor(v_uv.y * bands);
        float hit = step(rand(vec2(band, u_seed)), u_glitch * 0.45);
        uv.x += hit * (rand(vec2(band, u_seed + 3.1)) - 0.5) * 0.18 * u_glitch;
        // glitch: whole frame jumps a little vertically
        uv.y += u_glitch * (rand(vec2(u_seed, 9.2)) - 0.5) * 0.03;

        uv = clamp(uv, 0.0, 1.0);

        // RGB split (stronger during a glitch)
        float split = u_split + u_glitch * 0.012 + hit * 0.01;
        vec3 col;
        col.r = texture2D(u_tex, clamp(uv + vec2(split, 0.0), 0.0, 1.0)).r;
        col.g = texture2D(u_tex, uv).g;
        col.b = texture2D(u_tex, clamp(uv - vec2(split, 0.0), 0.0, 1.0)).b;

        // glitched bands get a little brighter / washed out
        col = mix(col, col * 1.25 + 0.05, hit * 0.6);

        // film grain
        float n = rand(gl_FragCoord.xy + fract(u_time * 7.13) * 100.0) - 0.5;
        col += n * u_grain;

        // scanlines
        col *= 1.0 - u_scan * (0.5 + 0.5 * sin(gl_FragCoord.y * 2.1));

        // flicker
        col *= 1.0 - u_flicker * rand(vec2(floor(u_time * 18.0), 4.4));

        // vignette
        float d = length(v_uv - 0.5);
        col *= 1.0 - u_vignette * smoothstep(0.35, 0.85, d);

        gl_FragColor = vec4(col, 1.0);
      }`;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      console.warn("Hero effect disabled:", error);
      return null;
    }
    gl.useProgram(program);

    // one full-screen rectangle
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const u = {};
    ["u_res", "u_vid", "u_time", "u_glitch", "u_seed", "u_grain", "u_scan", "u_split", "u_flicker", "u_vignette"]
      .forEach((name) => { u[name] = gl.getUniformLocation(program, name); });
    gl.uniform1f(u.u_grain, SETTINGS.grain);
    gl.uniform1f(u.u_scan, SETTINGS.scanlines);
    gl.uniform1f(u.u_split, SETTINGS.rgbSplit);
    gl.uniform1f(u.u_flicker, SETTINGS.flicker);
    gl.uniform1f(u.u_vignette, SETTINGS.vignette);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // capped: grain looks better and it's cheaper
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    // glitch bursts: short, random, a few seconds apart
    let glitchStart = 0;
    let glitchLength = 0;
    let glitchPower = 0;
    let nextGlitch = performance.now() + 1200;
    let seed = 0;

    function glitchAt(now) {
      if (now >= nextGlitch) {
        glitchStart = now;
        glitchLength = 90 + Math.random() * 260;
        glitchPower = 0.45 + Math.random() * 0.55;
        const gap = SETTINGS.glitchEveryMin + Math.random() * (SETTINGS.glitchEveryMax - SETTINGS.glitchEveryMin);
        nextGlitch = now + glitchLength + gap * 1000;
      }
      const inGlitch = now - glitchStart < glitchLength;
      if (inGlitch && Math.random() < 0.35) seed = Math.random() * 100;
      return inGlitch ? glitchPower : 0;
    }

    let running = false; // video is playing
    let visible = true;   // hero is on screen
    let disabled = false; // WebGL failed or the context was lost
    let frame = 0;
    let newVideoFrame = true;

    // upload a video frame to the GPU only when the video has a new one
    const hasFrameCallback = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
    function watchFrames() {
      video.requestVideoFrameCallback(() => {
        newVideoFrame = true;
        if (running) watchFrames();
      });
    }

    function hide() {
      hero.classList.remove("hero--fx"); // the plain video shows again
    }

    function disable(error) {
      if (error) console.warn("Hero effect disabled:", error);
      disabled = true;
      stop();
    }

    function draw(now) {
      frame = 0;
      if (!running || !visible || disabled) return;
      resize();

      if (video.readyState >= 2) {
        if (newVideoFrame || !hasFrameCallback) {
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
          } catch (error) {
            // e.g. the page was opened from file:// and the video counts as cross-origin
            disable(error);
            return;
          }
          newVideoFrame = false;
        }
        gl.uniform2f(u.u_res, canvas.width, canvas.height);
        gl.uniform2f(u.u_vid, video.videoWidth, video.videoHeight);
        gl.uniform1f(u.u_time, (now / 1000) % 60); // wrapped: big numbers lose precision on phone GPUs
        gl.uniform1f(u.u_glitch, glitchAt(now));
        gl.uniform1f(u.u_seed, seed);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        hero.classList.add("hero--fx"); // fades the canvas in over the plain video
      }
      frame = requestAnimationFrame(draw);
    }

    function start() {
      if (running || disabled) return;
      running = true;
      newVideoFrame = true;
      if (hasFrameCallback) watchFrames();
      if (visible && !frame) frame = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      hide();
    }

    // GPU reset or the browser reclaimed the context: fall back to the plain video
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      disable();
    });

    // only render while the hero is on screen
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && running && !frame) frame = requestAnimationFrame(draw);
    }).observe(hero);

    return { start, stop };
  }
})();
