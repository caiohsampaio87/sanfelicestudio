/*!
 * vhs-glitch-bg.js — efeito VHS + Glitch + Ruído analógico (WebGL) aplicado ao vivo num <video>.
 *
 * USO:
 *   <video id="bg" src="homebackground1.mp4" autoplay muted loop playsinline></video>
 *   <script src="vhs-glitch-bg.js"></script>
 *   <script>VhsGlitch('#bg');</script>
 *
 * Ou, sem JS extra: adicione o atributo  data-vhs-glitch  ao <video>.
 * Ajustes opcionais:  VhsGlitch('#bg', { uVhs: .2, uNoise: .33, uBloom: .39, uScan: .44, maxWidth: 1280 });
 * Todos os parâmetros (uSat, uBloom, uScan, uChroma...) são os mesmos sliders da ferramenta.
 */
(function () {
  var VS = `
attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;
  var FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uRes;
uniform float uTime, uNoise, uVhs, uTrack, uGlitch, uRate;
uniform float uCurve, uChroma, uBloom, uVig, uScan, uMask, uPixel, uWave, uJitter, uShake;
uniform float uBright, uContrast, uSat, uTemp, uMono, uSepia, uInvert, uPoster, uDither, uGrain, uFlicker, uOrig;

float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec3 tex(vec2 uv){ return texture2D(uTex, clamp(uv, 0.0, 1.0)).rgb; }
float bayer2(vec2 p){ p = mod(floor(p), 2.0); return mod(2.0*p.x + 3.0*p.y, 4.0); }
float bayer4(vec2 p){ return (bayer2(p)*4.0 + bayer2(floor(p*0.5)))/16.0; }

void main(){
  if (uOrig > 0.5){ gl_FragColor = vec4(tex(vUv), 1.0); return; }
  vec2 uv = vUv;
  float t = uTime;
  float rgbSplit = 0.0;
  float edge = 1.0;

  // ---------- LENTE / DISTORÇÃO ----------
  if (uCurve > 0.0){
    vec2 p = uv*2.0 - 1.0;
    p *= 1.0 + uCurve*0.22*dot(p, p);
    uv = p*0.5 + 0.5;
    vec2 e = smoothstep(0.0, 0.012, uv) * smoothstep(0.0, 0.012, 1.0 - uv);
    edge = e.x*e.y;
  }
  if (uPixel > 0.0){
    float px = 1.0 + uPixel*39.0;
    uv = (floor(uv*uRes/px) + 0.5)*px/uRes;
  }
  uv.x += uWave*0.02*sin(uv.y*18.0 + t*2.0);
  uv.y += uWave*0.008*sin(uv.x*14.0 + t*1.7);
  float sk = floor(t*24.0);
  uv += uShake*0.012*2.0*vec2(h11(sk*1.7) - 0.5, h11(sk*2.9 + 5.0) - 0.5);
  uv.x += uJitter*0.012*(h21(vec2(floor(vUv.y*uRes.y*0.5), floor(t*30.0) + 4.0)) - 0.5);

  // ---------- GLITCH ----------
  float slot = floor(t*uRate);
  float on   = step(0.45, h11(slot*7.13 + 1.0));
  float gi   = uGlitch * on;
  if (gi > 0.0){
    float nb   = mix(8.0, 42.0, h11(slot*3.7));
    float band = floor(uv.y*nb);
    float gate = step(0.72, h21(vec2(band+17.0, slot)));
    float sh   = (h21(vec2(band, slot)) - 0.5) * 0.35 * gate * gi;
    uv.x += sh;
    vec2 blk = floor(uv*vec2(14.0, 9.0));
    float bg = step(0.93, h21(blk + slot*1.3));
    uv += (vec2(h21(blk+1.0), h21(blk+2.0)) - 0.5) * 0.25 * bg * gi;
    uv.y += step(0.9, h11(slot*5.3)) * (h11(slot*9.0)-0.5) * 0.12 * gi;
    rgbSplit = gi*(0.004 + 0.02*h11(slot*2.1)) + abs(sh)*0.4;
  }

  // ---------- VHS: geometria ----------
  float v = uVhs;
  float line = floor(vUv.y*uRes.y*0.5);
  uv.x += v*(0.0015*sin(vUv.y*45.0 + t*3.0) + 0.0012*(h21(vec2(line, floor(t*30.0))) - 0.5));
  float trackBand = 0.0;
  if (uTrack > 0.0){
    float pos = fract(-t*0.12);
    float d = vUv.y - pos;
    d -= floor(d + 0.5);               // distância circular
    float w = smoothstep(0.07, 0.0, abs(d));
    uv.x += v*uTrack*w*0.05*sin(d*260.0 + t*50.0);
    trackBand = w;
  }

  // ---------- Amostragem + RGB split ----------
  vec3 c = tex(uv);
  float off = v*0.003 + rgbSplit;
  vec2 cdir = (uv - 0.5)*uChroma*0.04;
  c = vec3(tex(uv + vec2(off, 0.0) + cdir).r, c.g, tex(uv - vec2(off, 0.0) - cdir).b);

  // ---------- GLOW ----------
  if (uBloom > 0.0){
    vec3 acc = vec3(0.0);
    vec2 asp = vec2(uRes.y/uRes.x, 1.0);
    for (int i=0; i<8; i++){
      float a = float(i)*0.785398;
      vec2 d = vec2(cos(a), sin(a))*asp;
      acc += max(tex(uv + d*0.008) - 0.55, 0.0) + max(tex(uv + d*0.022) - 0.55, 0.0);
    }
    c += acc/8.0*uBloom*1.2;
  }

  // ---------- VHS: chroma bleed (YIQ) ----------
  if (v > 0.0){
    vec3 acc = vec3(0.0);
    float bl = 0.008*v;
    for (int i=-4; i<=4; i++) acc += tex(vec2(uv.x + float(i)*bl/4.0 + 0.002*v, uv.y));
    acc /= 9.0;
    float Y  = dot(c,   vec3(0.299, 0.587, 0.114));
    float Ib = dot(acc, vec3(0.596,-0.274,-0.322));
    float Qb = dot(acc, vec3(0.211,-0.523, 0.312));
    float I0 = dot(c,   vec3(0.596,-0.274,-0.322));
    float Q0 = dot(c,   vec3(0.211,-0.523, 0.312));
    float I = mix(I0, Ib, v)*mix(1.0, 0.85, v);
    float Q = mix(Q0, Qb, v)*mix(1.0, 0.85, v);
    c = vec3(Y + 0.956*I + 0.621*Q, Y - 0.272*I - 0.647*Q, Y - 1.106*I + 1.703*Q);
    // grade fita: contraste suave, preto levantado, leve tinta
    c = mix(c, (c-0.5)*1.08 + 0.5 + vec3(0.025, 0.005, 0.035), v);
    c = max(c, vec3(0.03*v));
    // scanlines
    float s = 0.5 + 0.5*sin(vUv.y*uRes.y*3.14159);
    c *= 1.0 - v*0.16*(1.0 - s);
    // faixa de tracking: ruído branco
    c += trackBand*v*uTrack*0.6*h21(vec2(floor(vUv.x*uRes.x*0.5), floor(vUv.y*uRes.y*0.5) + floor(t*60.0)));
    // vinheta
    float vg = length(vUv - 0.5)*1.4;
    c *= 1.0 - v*0.4*vg*vg;
  }

  // ---------- COR ----------
  {
    float fl = 1.0 + uFlicker*0.3*(h11(floor(t*24.0)) - 0.5) + uFlicker*0.06*sin(t*50.0);
    c *= fl;
    c = (c - 0.5)*uContrast + 0.5 + uBright;
    c *= vec3(1.0 + uTemp*0.15, 1.0, 1.0 - uTemp*0.15);
    float Yc = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(Yc), c, uSat);
    c = mix(c, vec3(Yc), uMono);
    c = mix(c, vec3(Yc)*vec3(1.2, 1.0, 0.8), uSepia);
    c = mix(c, 1.0 - c, uInvert);
  }

  // ---------- RUÍDO ANALÓGICO ----------
  if (uNoise > 0.0){
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    vec2 fc = gl_FragCoord.xy;
    float fr = floor(t*30.0);
    float fine   = h21(fc + fr*vec2(37.0, 91.0)) - 0.5;
    float coarse = h21(floor(fc/vec2(3.0, 1.0)) + fr*vec2(13.0, 57.0)) - 0.5;
    c += (fine*0.25 + coarse*0.2) * uNoise * (1.25 - lum);
    // riscos horizontais (snow)
    float ln = h21(vec2(floor(fc.y/2.0), fr));
    float streak = step(1.0 - 0.012*uNoise, ln);
    c += streak * uNoise * 0.55 * h21(vec2(floor(fc.x/12.0), fr + 3.0));
    // dropouts brancos curtos
    float dr = step(1.0 - 0.0015*uNoise, h21(vec2(floor(fc.y/3.0), fr*1.7)));
    float seg = step(0.5, h21(vec2(floor(fc.x/90.0), floor(fc.y/3.0) + fr)));
    c += dr*seg*0.8;
  }

  // ---------- ESTILO / TELA ----------
  {
    vec2 fc2 = gl_FragCoord.xy;
    float lv = uPoster > 0.0 ? mix(32.0, 3.0, uPoster) : (uDither > 0.0 ? 6.0 : 0.0);
    if (lv > 0.0){
      c += (bayer4(fc2) - 0.5)*uDither/lv;
      c = floor(c*lv + 0.5)/lv;
    }
    float period = max(2.0, uRes.y/240.0);
    float sl = 0.5 + 0.5*sin(vUv.y*uRes.y*6.28318/period);
    c *= 1.0 - uScan*0.55*(1.0 - sl);
    float m = mod(floor(fc2.x), 3.0);
    vec3 mk = vec3(1.0 - step(0.5, m), step(0.5, m)*(1.0 - step(1.5, m)), step(1.5, m));
    c *= mix(vec3(1.0), 0.35 + 1.95*mk, uMask);
    float vg2 = length(vUv - 0.5)*1.4;
    c *= 1.0 - uVig*1.2*vg2*vg2;
    float gr = h21(fc2*0.8 + floor(t*24.0)*vec2(11.0, 17.0)) - 0.5;
    c += gr*uGrain*0.4;
    c *= edge;
  }

  gl_FragColor = vec4(c, 1.0);
}`;
  var DEFAULTS = {"uNoise": 0.33, "uVhs": 0.2, "uTrack": 0.0, "uGlitch": 0.0, "uRate": 6.0, "uCurve": 0.0, "uChroma": 0.22, "uBloom": 0.39, "uVig": 0.5, "uScan": 0.44, "uMask": 0.43, "uPixel": 0.0, "uWave": 0.0, "uJitter": 0.0, "uShake": 0.0, "uBright": 0.0, "uContrast": 1.0, "uSat": 1.0, "uTemp": 0.0, "uMono": 0.0, "uSepia": 0.0, "uInvert": 0.0, "uPoster": 0.0, "uDither": 0.0, "uGrain": 0.0, "uFlicker": 0.18};

  function VhsGlitch(target, opts) {
    var video = typeof target === 'string' ? document.querySelector(target) : target;
    if (!video || video.__vhs) return video && video.__vhs;
    opts = opts || {};
    var P = Object.assign({}, DEFAULTS, opts, { uOrig: 0 });
    var maxW = opts.maxWidth || 1280; // limita a resolução de render p/ ficar leve
    var isVideo = video.tagName === 'VIDEO';

    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return null; // sem WebGL: o vídeo original continua visível

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);

    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    var loc = {};
    ['uRes', 'uTime'].concat(Object.keys(P)).forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });

    // o canvas assume o lugar e o layout do vídeo (classe, estilo inline, object-fit)
    canvas.className = video.className;
    canvas.style.cssText = video.style.cssText;
    var cs = getComputedStyle(video);
    canvas.style.objectFit = cs.objectFit;
    canvas.style.objectPosition = cs.objectPosition;
    if (!canvas.style.width && !video.className) { canvas.style.width = '100%'; canvas.style.height = '100%'; }
    canvas.setAttribute('aria-hidden', 'true');
    video.parentNode.insertBefore(canvas, video);
    // o vídeo continua tocando, só que escondido (sem ocupar espaço)
    var origCss = video.style.cssText;
    video.style.cssText += ';position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important';

    var running = true, visible = true, raf = 0, t0 = performance.now();
    function size() {
      // works with a <video> or an <img> (e.g. the Contact page background)
      var w = video.videoWidth || video.naturalWidth, h = video.videoHeight || video.naturalHeight;
      if (!w) return false;
      var k = Math.min(1, maxW / w);
      var cw = Math.round(w * k), ch = Math.round(h * k);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      return true;
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      var ready = isVideo ? video.readyState >= 2 : video.complete && video.naturalWidth > 0;
      if (!visible || document.hidden || !ready || !size()) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } catch (e) {
        console.warn('[VhsGlitch] Não deu para aplicar o efeito (' + e.message + '). ' +
          'Abra o site por http(s) ou por um servidor local, não por file://. Mostrando o vídeo normal.');
        api.destroy();
        return;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      gl.uniform1f(loc.uTime, ((performance.now() - t0) / 1000) % 10000);
      for (var k in P) if (loc[k]) gl.uniform1f(loc[k], P[k]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
    }
    if (isVideo && video.paused) video.play().catch(function () {});
    frame();

    var api;
    var stopped = false;
    api = {
      set: function (k, v) { P[k] = v; },
      // stop / restart drawing (used by the hero's pause button; the last frame stays on screen)
      pause: function () { stopped = true; cancelAnimationFrame(raf); },
      resume: function () { if (stopped) { stopped = false; frame(); } },
      destroy: function () { cancelAnimationFrame(raf); canvas.remove(); video.style.cssText = origCss; delete video.__vhs; }
    };
    video.__vhs = api;
    return api;
  }

  window.VhsGlitch = VhsGlitch;
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('video[data-vhs-glitch]').forEach(function (v) { VhsGlitch(v); });
  });
})();