import * as THREE from "three";
import { buildFormations } from "./formations";

/**
 * O fundo vivo do site. Duas camadas num único canvas fixo:
 * 1. o campo de cor: terracota ou creme conforme a seção (`data-bg`), com a borda entre elas ondulando;
 * 2. as pétalas: milhares de instâncias que mudam de forma conforme a seção (`data-scene`).
 * A cor de cada pétala depende do campo atrás dela, calculado no próprio shader.
 */

const MAX_SECTIONS = 12;
const FOV = 40;
const CAMERA_Z = 9;

const FIELD_GLSL = /* glsl */ `
  uniform float uBounds[${MAX_SECTIONS}];
  uniform float uFlags[${MAX_SECTIONS}];
  uniform int uCount;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uTime;

  // 1.0 = terracota, 0.0 = creme, no pixel atual (coordenadas CSS a partir do topo).
  float fieldAt(vec2 frag) {
    float x = frag.x / uDpr;
    float y = (uRes.y - frag.y) / uDpr;
    float wave = sin(x * 0.0055 + uTime * 0.55) * 11.0 + sin(x * 0.0131 - uTime * 0.4) * 6.0;
    float flag = uCount > 0 ? uFlags[0] : 0.0;
    for (int i = 0; i < ${MAX_SECTIONS}; i++) {
      if (i >= uCount) break;
      if (y + wave >= uBounds[i]) flag = uFlags[i];
    }
    return flag;
  }
`;

const BG_VERT = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BG_FRAG = /* glsl */ `
  precision highp float;
  ${FIELD_GLSL}
  uniform vec2 uPointer;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    float f = fieldAt(gl_FragCoord.xy);
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 cream = vec3(0.969, 0.929, 0.890);
    vec3 brand = vec3(0.608, 0.314, 0.188);
    vec3 col = mix(cream, brand, f);
    // Uma luz quente e lenta que segue de longe o ponteiro.
    vec2 c = vec2(0.5 + uPointer.x * 0.12 + sin(uTime * 0.07) * 0.15, 0.62 + uPointer.y * 0.08);
    float glow = smoothstep(0.85, 0.0, distance(uv * vec2(uRes.x / uRes.y, 1.0), c * vec2(uRes.x / uRes.y, 1.0)));
    col += mix(vec3(0.016, 0.012, 0.01), vec3(0.07, 0.035, 0.015), f) * glow;
    col -= (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.018;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const PETAL_VERT = /* glsl */ `
  attribute vec3 aF0;
  attribute vec3 aF1;
  attribute vec3 aF2;
  attribute vec3 aF3;
  attribute vec4 aSeed;
  uniform float uMix;
  uniform float uTime;
  uniform float uWind;
  uniform vec2 uPointerW;
  uniform float uSize;
  varying vec2 vUv;
  varying float vGlow;
  varying float vHue;
  varying float vFade;

  vec3 pick(float i, vec3 a, vec3 b, vec3 c, vec3 d) {
    return i < 0.5 ? a : i < 1.5 ? b : i < 2.5 ? c : d;
  }

  void main() {
    float phase = aSeed.x * 6.2831;
    float speed = aSeed.y;
    float t = uTime;

    // Chuva: cai em laço contínuo.
    vec3 p0 = aF0;
    p0.y = mod(p0.y - t * 0.22 * speed + 6.0, 12.0) - 6.0;
    p0.x += sin(t * 0.5 * speed + phase) * 0.35;
    // Guirlanda: gira devagar em torno do próprio eixo.
    vec3 p1 = aF1 + vec3(0.0, sin(t * 0.6 + aF1.x * 0.8) * 0.12, 0.0);
    // Luzes: quase paradas, só um balanço de fio.
    vec3 p2 = aF2 + vec3(0.0, sin(t * 0.9 + aF2.x * 0.6) * 0.04, 0.0);
    // Arco: respira.
    vec3 p3 = aF3 + vec3(sin(t * 0.7 + phase) * 0.03, cos(t * 0.6 + phase) * 0.03, 0.0);

    // Cada pétala sai um pouco antes ou depois das vizinhas.
    float m = clamp(uMix + (aSeed.x - 0.5) * 0.45, 0.0, 3.0);
    float i0 = min(floor(m), 2.0);
    float f = smoothstep(0.0, 1.0, m - i0);
    vec3 a = pick(i0, p0, p1, p2, p3);
    vec3 b = pick(i0 + 1.0, p0, p1, p2, p3);
    vec3 pos = mix(a, b, f);
    // No caminho entre uma forma e outra, as pétalas fazem uma curva no ar.
    float arc = sin(f * 3.14159);
    pos += vec3(sin(phase) * 0.9, 0.6 + cos(phase) * 0.5, cos(phase * 1.7) * 0.8) * arc * speed;

    float glow = i0 == 1.0 ? f : i0 == 2.0 ? 1.0 - f : 0.0;
    vGlow = glow;

    // Vento: a velocidade da rolagem agita as pétalas.
    float sway = (1.0 - glow * 0.85) * (0.06 + uWind * 0.5);
    pos += vec3(sin(t * 1.3 * speed + phase), cos(t * 1.1 * speed + phase * 1.3), sin(t * 0.9 + phase)) * sway;

    // O ponteiro afasta as pétalas próximas.
    vec2 d = pos.xy - uPointerW;
    float push = exp(-dot(d, d) * 2.2) * (1.0 - glow) * 0.6;
    pos.xy += normalize(d + 1e-4) * push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Pétala gira em 3D; luz fica de frente.
    float ang1 = t * 0.8 * speed + phase;
    float ang2 = t * 0.6 * speed + phase * 2.0;
    vec3 q = vec3(position.xy, 0.0);
    q = vec3(q.x * cos(ang1) - q.y * sin(ang1), q.x * sin(ang1) + q.y * cos(ang1), 0.0);
    q = vec3(q.x, q.y * cos(ang2), q.y * sin(ang2));
    vec3 local = mix(q, vec3(position.xy, 0.0), glow);

    bool leaf = aSeed.w > 0.86;
    float size = uSize * aSeed.z * mix(leaf ? 1.5 : 1.0, 0.55 + 0.25 * sin(t * 2.0 + phase * 3.0), glow);
    mv.xyz += local * size * vec3(leaf ? 0.55 : 0.8, 1.0, 1.0);
    gl_Position = projectionMatrix * mv;

    vUv = position.xy * 2.0;
    vHue = aSeed.w;
    vFade = smoothstep(-22.0, -9.0, mv.z);
  }
`;

const PETAL_FRAG = /* glsl */ `
  precision highp float;
  ${FIELD_GLSL}
  varying vec2 vUv;
  varying float vGlow;
  varying float vHue;
  varying float vFade;

  vec3 onBrand(float h) {
    return h < 0.3 ? vec3(0.984, 0.918, 0.859) : h < 0.55 ? vec3(0.957, 0.827, 0.706) : h < 0.72 ? vec3(1.0, 0.973, 0.941) : h < 0.86 ? vec3(0.914, 0.69, 0.561) : vec3(0.78, 0.47, 0.31);
  }
  vec3 onCream(float h) {
    return h < 0.3 ? vec3(0.769, 0.416, 0.259) : h < 0.55 ? vec3(0.608, 0.314, 0.188) : h < 0.72 ? vec3(0.89, 0.627, 0.486) : h < 0.86 ? vec3(0.851, 0.565, 0.373) : vec3(0.56, 0.6, 0.42);
  }

  void main() {
    vec2 uv = vUv;
    bool leaf = vHue > 0.86;
    // Pétala: gota com a ponta para cima; folha: afinada nas duas pontas.
    float w = leaf ? 0.42 * (1.0 - uv.y * uv.y * 0.9) : 0.62 * (1.0 - uv.y * 0.42);
    float petal = 1.0 - smoothstep(0.82, 1.0, length(vec2(uv.x / max(w, 0.05), uv.y)));
    float shade = 0.82 + 0.18 * (uv.y * 0.5 + 0.5) - (leaf ? 0.12 * smoothstep(0.06, 0.0, abs(uv.x)) : 0.0);

    float r2 = dot(uv, uv);
    float light = exp(-r2 * 9.0) + exp(-r2 * 2.2) * 0.35;

    float bg = fieldAt(gl_FragCoord.xy);
    vec3 petalCol = mix(onCream(vHue), onBrand(vHue), bg) * shade;
    vec3 lightCol = mix(vec3(0.85, 0.52, 0.24), vec3(1.0, 0.86, 0.6), bg) + vec3(0.25) * exp(-r2 * 30.0);

    float alpha = mix(petal * mix(0.62, 0.8, bg), light, vGlow) * vFade;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(mix(petalCol, lightCol, vGlow), alpha);
  }
`;

type Section = { el: HTMLElement; flag: number; scene: number };

export type SceneHandle = { destroy: () => void };

export function startScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = window.innerWidth < 768;
  const count = small ? 750 : 2600;
  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;

  const shared = {
    uBounds: { value: new Array(MAX_SECTIONS).fill(1e6) },
    uFlags: { value: new Array(MAX_SECTIONS).fill(0) },
    uCount: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: dpr },
    uTime: { value: 0 },
  };

  // Campo de cor
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.Camera();
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
    uniforms: { ...shared, uPointer: { value: new THREE.Vector2() } },
    depthTest: false,
    depthWrite: false,
  });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.frustumCulled = false;
  bgScene.add(bgMesh);

  // Pétalas
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.instanceCount = count;
  const petalUniforms = {
    ...shared,
    uMix: { value: 0 },
    uWind: { value: 0 },
    uPointerW: { value: new THREE.Vector2(99, 99) },
    uSize: { value: small ? 0.13 : 0.17 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: PETAL_VERT,
    fragmentShader: PETAL_FRAG,
    uniforms: petalUniforms,
    transparent: true,
    depthWrite: false,
  });
  const petals = new THREE.Mesh(geo, mat);
  petals.frustumCulled = false;
  scene.add(petals);

  let halfH = 1;
  let halfW = 1;
  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    shared.uRes.value.set(w * dpr, h * dpr);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = CAMERA_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
    halfW = halfH * camera.aspect;
    const f = buildFormations(count, { halfW, halfH, portrait: camera.aspect < 0.85 });
    geo.setAttribute("aF0", new THREE.InstancedBufferAttribute(f.f0, 3));
    geo.setAttribute("aF1", new THREE.InstancedBufferAttribute(f.f1, 3));
    geo.setAttribute("aF2", new THREE.InstancedBufferAttribute(f.f2, 3));
    geo.setAttribute("aF3", new THREE.InstancedBufferAttribute(f.f3, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(f.seed, 4));
  }
  layout();

  // Seções da página atual (a lista muda quando a rota muda).
  let sections: Section[] = [];
  function collect() {
    sections = [...document.querySelectorAll<HTMLElement>("[data-bg]")].slice(0, MAX_SECTIONS).map((el) => ({
      el,
      flag: el.dataset.bg === "brand" ? 1 : 0,
      scene: Number(el.dataset.scene ?? 0),
    }));
  }
  collect();
  const mo = new MutationObserver(collect);
  mo.observe(document.body, { childList: true, subtree: true });

  // Ponteiro
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  let pointerActive = false;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    pointerActive = true;
    pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  const onLeave = () => (pointerActive = false);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  let resizeTimer = 0;
  let lastW = window.innerWidth;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      // No celular a barra de endereço muda a altura; só refaz as formas quando a largura muda.
      if (window.innerWidth !== lastW || !small) {
        lastW = window.innerWidth;
        dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
        renderer.setPixelRatio(dpr);
        shared.uDpr.value = dpr;
        layout();
      } else {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        shared.uRes.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
      }
    }, 120);
  };
  window.addEventListener("resize", onResize);

  let mix = -1;
  let lastScroll = window.scrollY;
  let wind = 0;
  let raf = 0;
  let last = performance.now();
  let time = 0;

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!opts.reducedMotion) time += dt;
    shared.uTime.value = time;

    const vh = window.innerHeight;
    const center = vh * 0.5;
    let target = 0;
    let n = 0;
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const rect = s.el.getBoundingClientRect();
      shared.uBounds.value[i] = rect.top;
      shared.uFlags.value[i] = s.flag;
      n++;
      if (rect.top <= center) {
        const next = sections[i + 1];
        const t = rect.height > 0 ? (center - rect.top) / rect.height : 1;
        const blend = next ? smooth(0.6, 1, t) : 0;
        target = s.scene + ((next?.scene ?? s.scene) - s.scene) * blend;
      }
    }
    shared.uCount.value = n;

    if (mix < 0 || opts.reducedMotion) mix = target;
    else mix += (target - mix) * (1 - Math.exp(-dt * 2.2));
    petalUniforms.uMix.value = mix;

    const scroll = window.scrollY;
    const v = Math.abs(scroll - lastScroll) / Math.max(dt, 0.001);
    lastScroll = scroll;
    wind += (Math.min(v / 2500, 1) - wind) * (1 - Math.exp(-dt * 3));
    petalUniforms.uWind.value = opts.reducedMotion ? 0 : wind;

    pointer.lerp(pointerActive ? pointerTarget : new THREE.Vector2(), 1 - Math.exp(-dt * 4));
    bgMat.uniforms.uPointer.value.copy(pointer);
    if (pointerActive) petalUniforms.uPointerW.value.set(pointer.x * halfW, pointer.y * halfH);
    else petalUniforms.uPointerW.value.set(99, 99);

    // A câmera se inclina com o ponteiro e com o avanço da página.
    camera.position.x = pointer.x * 0.35 + Math.sin(mix * 0.9) * 0.4;
    camera.position.y = pointer.y * 0.22;
    camera.lookAt(0, 0, -1);

    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      renderer.dispose();
    },
  };
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}
