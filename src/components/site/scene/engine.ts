import * as THREE from "three";

/**
 * O fundo vivo do site, num único canvas fixo. A rolagem é uma travessia: quem desce a página
 * caminha para a frente por um salão, atravessando uma galeria de arcos. São quatro camadas:
 * 1. o campo de cor: creme, terracota ou café conforme a seção (`data-bg`). Onde uma seção encontra
 *    outra de cor diferente, a de baixo entra por cima como um tecido drapeado: borda em dobras,
 *    sombra sobre a de cima e brilho nas dobras. As dobras balançam com a velocidade da rolagem;
 * 2. a galeria: arcos de filete duplo dourado, a forma da logo, com cortinas de voil presas dos
 *    lados. Eles vêm do fundo do salão, passam pela câmera e voltam ao fundo;
 * 3. luzes desfocadas (bokeh) espalhadas pelo salão, passando em profundidade, só sobre o
 *    terracota e o café;
 * 4. fitas de seda acetinada que mudam de lugar conforme a seção (`data-scene`): onda baixa na
 *    abertura, faixa rente ao pé nos destaques e no Sobre, fios dourados no alto no processo e
 *    um drapeado de teto no orçamento e no contato.
 * A cor de tudo depende do campo atrás, calculado no próprio shader. A rolagem rápida abre o campo
 * de visão e fecha a vinheta, como um passo mais longo.
 */

const MAX_SECTIONS = 12;
const FOV = 40;
const CAMERA_Z = 9;
/** Quanto a câmera avança a cada altura de tela rolada. */
const TRAVEL_PER_SCREEN = 7;
/** Trecho do salão onde os arcos existem; ao sair pela frente, um arco volta ao fundo. */
const HALL_FAR = -32;
const HALL_NEAR = 7;
const HALL_DEPTH = HALL_NEAR - HALL_FAR;
const BOKEH_FAR = -24;
const BOKEH_NEAR = 6.5;
const BOKEH_DEPTH = BOKEH_NEAR - BOKEH_FAR;

const FIELD_GLSL = /* glsl */ `
  uniform float uBounds[${MAX_SECTIONS}];
  uniform float uFlags[${MAX_SECTIONS}];
  uniform int uCount;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uTime;
  uniform float uWind;

  vec3 flagWeights(float f) {
    return f < 0.5 ? vec3(1.0, 0.0, 0.0) : f < 1.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  }

  // Deslocamento da borda (px CSS): três dobras de tecido; a rolagem rápida as faz balançar.
  float drape(float x) {
    float a = 1.0 + uWind * 2.2;
    return (sin(x * 0.0041 + uTime * 0.35) * 10.0 + sin(x * 0.0113 - uTime * 0.27) * 4.5 + sin(x * 0.027 + uTime * 0.6) * 1.6) * a;
  }
  float folds(float x) {
    return cos(x * 0.0041 + uTime * 0.35) * 0.5 + cos(x * 0.0113 - uTime * 0.27) * 0.35 + cos(x * 0.027 + uTime * 0.6) * 0.15;
  }

  // Pesos (creme, terracota, café) no pixel e distância até a borda mais próxima (px, positiva abaixo).
  vec3 fieldAt(vec2 frag, out float edge) {
    float x = frag.x / uDpr;
    float y = (uRes.y - frag.y) / uDpr;
    float wv = drape(x);
    float prev = uCount > 0 ? uFlags[0] : 0.0;
    vec3 w = flagWeights(prev);
    edge = 1e5;
    for (int i = 1; i < ${MAX_SECTIONS}; i++) {
      if (i >= uCount) break;
      float f = uFlags[i];
      if (abs(f - prev) < 0.5) continue;
      float d = y + wv - uBounds[i];
      w = mix(w, flagWeights(f), smoothstep(-0.8, 0.8, d));
      if (abs(d) < abs(edge)) edge = d;
      prev = f;
    }
    return w;
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
    float edge;
    vec3 w = fieldAt(gl_FragCoord.xy, edge);
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 cream = vec3(0.969, 0.929, 0.890);
    vec3 brand = vec3(0.608, 0.314, 0.188);
    vec3 noir = vec3(0.137, 0.075, 0.047);
    vec3 col = w.x * cream + w.y * brand + w.z * noir;

    // Uma luz quente e lenta que segue de longe o ponteiro.
    float aspect = uRes.x / uRes.y;
    vec2 c = vec2(0.5 + uPointer.x * 0.12 + sin(uTime * 0.07) * 0.15, 0.62 + uPointer.y * 0.08);
    float glow = smoothstep(0.85, 0.0, distance(uv * vec2(aspect, 1.0), c * vec2(aspect, 1.0)));
    col += (w.x * vec3(0.016, 0.012, 0.01) + w.y * vec3(0.07, 0.035, 0.015) + w.z * vec3(0.07, 0.04, 0.015)) * glow;
    // Vinheta: as bordas escurecem, mais no café, como luz de salão.
    col *= 1.0 - smoothstep(0.55, 1.25, length((uv - 0.5) * vec2(1.25, 1.0))) * (0.08 + w.z * 0.32 + uWind * 0.16);

    // Luz de cortina: faixas largas e lentas, como sol atravessando voil.
    vec2 q = gl_FragCoord.xy / uDpr;
    float veil = sin(q.x * 0.0021 + q.y * 0.0012 + uTime * 0.11) * 0.6 + sin(q.x * 0.0047 - q.y * 0.0009 - uTime * 0.07) * 0.4;
    col += vec3(1.0, 0.93, 0.82) * smoothstep(0.2, 1.0, veil) * (w.x * 0.018 + w.y * 0.035 + w.z * 0.03);

    // O tecido da seção de baixo: sombra sobre a de cima, brilho e sombra nas dobras logo abaixo da borda.
    float x = gl_FragCoord.x / uDpr;
    if (edge < 0.0) {
      col *= 1.0 - 0.16 * exp(edge / 16.0);
    } else if (edge < 400.0) {
      float band = exp(-edge / 90.0);
      float f = folds(x);
      col += vec3(1.0, 0.94, 0.86) * band * max(f, 0.0) * 0.07;
      col *= 1.0 - band * max(-f, 0.0) * 0.08;
    }

    col -= (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.018;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const HALL_GLSL = /* glsl */ `
  attribute float aZ;
  uniform float uTravel;
  uniform float uHalfW;
  uniform float uHalfH;
  varying float vFade;

  // Posição no salão: aparece aos poucos no fundo e some antes de encostar na câmera.
  float hallZ() {
    float z = mod(aZ + uTravel, ${HALL_DEPTH}.0) + (${HALL_FAR}.0);
    vFade = smoothstep(${HALL_FAR}.0, ${HALL_FAR + 12}.0, z) * (1.0 - smoothstep(${HALL_NEAR - 3}.0, ${HALL_NEAR}.0, z));
    return z;
  }
  float archRadius() { return max(uHalfW * 0.86, 2.3); }
  float archFloor() { return -uHalfH * 1.25; }
  float archSpring() { return uHalfH * 0.75; }
`;

const ARCH_VERT = /* glsl */ `
  ${HALL_GLSL}
  varying float vRise;

  void main() {
    const float PI = 3.14159265;
    float z = hallZ();
    float R = archRadius();
    float leg = archSpring() - archFloor();
    float d = position.x * (2.0 * leg + PI * R);
    vec2 p;
    vec2 n;
    if (d < leg) {
      p = vec2(-R, archFloor() + d);
      n = vec2(-1.0, 0.0);
    } else if (d < leg + PI * R) {
      float a = PI - (d - leg) / R;
      n = vec2(cos(a), sin(a));
      p = vec2(0.0, archSpring()) + n * R;
    } else {
      p = vec2(R, archFloor() + 2.0 * leg + PI * R - d);
      n = vec2(1.0, 0.0);
    }
    // O traço engrossa com a distância para não sumir no fundo do salão.
    float w = (0.016 + (${HALL_NEAR}.0 - z) * 0.0014) * (1.0 - position.z * 2.0);
    p += n * (position.z + position.y * w);
    vRise = (p.y - archFloor()) / leg;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, z, 1.0);
  }
`;

const ARCH_FRAG = /* glsl */ `
  precision highp float;
  ${FIELD_GLSL}
  varying float vFade;
  varying float vRise;

  void main() {
    float edge;
    vec3 w = fieldAt(gl_FragCoord.xy, edge);
    vec3 col = w.x * vec3(0.72, 0.55, 0.33) + w.y * vec3(0.96, 0.83, 0.68) + w.z * vec3(0.9, 0.74, 0.5);
    // Discretos atrás do texto; a base se dissolve, como névoa no chão do salão.
    float a = (w.x * 0.2 + w.y * 0.26 + w.z * 0.32) * smoothstep(0.02, 0.5, vRise);
    gl_FragColor = vec4(col, a * vFade);
  }
`;

const CURTAIN_VERT = /* glsl */ `
  ${HALL_GLSL}
  attribute float aSide;
  uniform float uTime;
  uniform float uWind;
  varying vec2 vCloth;

  void main() {
    float z = hallZ();
    float R = archRadius();
    float u = position.x + 0.5;
    float v = position.y + 0.5;
    float x = R * (1.0 - 0.36 * u);
    // O topo acompanha a curva do arco; a amarração recolhe o tecido junto à coluna.
    float top = archSpring() + sqrt(max(R * R - x * x, 0.0));
    float tie = 1.0 - 0.68 * exp(-pow((v - 0.3) / 0.2, 2.0));
    x = R - (R - x) * tie;
    float sway = sin(u * 8.0 + aZ + uTime * 0.3 + uTravel * 0.2) * (0.1 + uWind * 0.3) * u;
    vCloth = vec2(u, v);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(x * aSide, mix(archFloor(), top, v), z + sway, 1.0);
  }
`;

const CURTAIN_FRAG = /* glsl */ `
  precision highp float;
  ${FIELD_GLSL}
  varying float vFade;
  varying vec2 vCloth;

  void main() {
    float edge;
    vec3 w = fieldAt(gl_FragCoord.xy, edge);
    float fold = 0.5 + 0.5 * sin(vCloth.x * 46.0 + sin(vCloth.y * 3.0) * 1.6);
    vec3 base = w.x * vec3(0.88, 0.76, 0.6) + w.y * vec3(0.98, 0.86, 0.74) + w.z * vec3(0.8, 0.6, 0.38);
    float a = (w.x * 0.11 + w.y * 0.13 + w.z * 0.15) * (0.45 + 0.55 * fold) * (1.0 - smoothstep(0.55, 1.0, vCloth.x));
    a *= smoothstep(0.0, 0.32, vCloth.y);
    gl_FragColor = vec4(base * (0.84 + 0.24 * fold), a * vFade);
  }
`;

const RIBBON_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uTravel;
  uniform float uHalfW;
  uniform float uHalfH;
  uniform vec4 uShape; // altura, amplitude, inclinação, curva (frações de uHalfH)
  uniform vec4 uForm;  // largura, torção, profundidade, espaçamento
  uniform float uIndex;
  uniform float uRibbons;
  uniform float uSeed;
  uniform vec2 uPointerW;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAcross;

  vec3 ribbon(float u, float v) {
    float k = uIndex - (uRibbons - 1.0) * 0.5;
    float xn = u * 2.0 - 1.0;
    float x = xn * uHalfW * 1.4;
    // A onda anda com o tempo e, mais depressa, com a rolagem: as fitas acompanham quem caminha.
    float t = uTime * (0.16 + uIndex * 0.035) + uTravel * 0.09;
    float ph = uSeed * 6.2831;
    float y = (uShape.x + k * uForm.w + xn * uShape.z + uShape.w * (1.0 - xn * xn * 0.8)) * uHalfH;
    y += uShape.y * uHalfH * (sin(xn * 1.7 + t + ph) * 0.6 + sin(xn * 3.1 - t * 1.3 + ph * 0.5) * 0.4);
    y += sin(xn * 5.0 + uTime * 1.6) * 0.07 * uWind * uHalfH;
    float z = uForm.z + sin(xn * 2.0 + t * 0.8 + ph) * 0.6 - abs(k) * 0.5;
    // O ponteiro levanta a fita por perto.
    vec2 d = vec2(x, y) - uPointerW;
    y += exp(-dot(d, d) * 0.7) * 0.35;
    // A fita fica quase de frente, com dobras que viram devagar; a torção só aparece nas curvas.
    float th = xn * uForm.y * 0.35 + sin(t * 0.6 + ph) * 0.55 + sin(xn * 2.3 - t) * 0.45;
    float wid = uForm.x * (0.72 + 0.28 * sin(xn * 2.0 + ph * 0.8));
    return vec3(x, y, z) + vec3(0.0, cos(th), sin(th)) * v * wid;
  }

  void main() {
    float u = position.x + 0.5;
    float v = position.y;
    vec3 p = ribbon(u, v);
    vec3 du = ribbon(u + 0.002, v) - p;
    vec3 dv = ribbon(u, v + 0.02) - p;
    vNormal = normalize(normalMatrix * cross(du, dv));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vView = -mv.xyz;
    vAcross = v;
    gl_Position = projectionMatrix * mv;
  }
`;

const RIBBON_FRAG = /* glsl */ `
  precision highp float;
  ${FIELD_GLSL}
  uniform float uTone;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAcross;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 V = normalize(vView);
    if (dot(n, V) < 0.0) n = -n;
    vec3 L = normalize(vec3(-0.35, 0.65, 0.68));
    float diff = 0.55 + 0.45 * max(dot(n, L), 0.0);
    float spec = pow(max(dot(n, normalize(L + V)), 0.0), 42.0);
    float sheen = pow(1.0 - max(dot(n, V), 0.0), 2.5);

    float edge;
    vec3 w = fieldAt(gl_FragCoord.xy, edge);
    // Cetim champanhe sobre o creme, pêssego sobre o terracota, ouro sobre o café.
    vec3 onCream = mix(vec3(0.78, 0.63, 0.43), vec3(0.9, 0.8, 0.64), uTone);
    vec3 onBrand = mix(vec3(0.95, 0.8, 0.66), vec3(0.99, 0.92, 0.84), uTone);
    vec3 onNoir = mix(vec3(0.72, 0.55, 0.33), vec3(0.9, 0.77, 0.55), uTone);
    vec3 base = w.x * onCream + w.y * onBrand + w.z * onNoir;

    // Fios do cetim, finos ao longo da fita.
    float weave = 0.97 + 0.03 * sin(vAcross * 260.0);
    vec3 col = base * diff * weave + base * sheen * 0.55 + vec3(1.0, 0.96, 0.9) * spec * (0.55 + w.z * 0.3);
    // Voil translúcido sobre o creme e o terracota; seda cheia sobre o café.
    float a = smoothstep(0.5, 0.3, abs(vAcross)) * uAlpha * (w.x * 0.4 + w.y * 0.45 + w.z * 0.88);
    gl_FragColor = vec4(col, a);
  }
`;

const BOKEH_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uTravel;
  uniform float uDpr;
  uniform float uHalfH;
  uniform float uScale;
  varying float vTwinkle;

  void main() {
    vec3 p = position;
    float span = uHalfH * 5.0;
    p.y = mod(p.y + uTime * 0.05 * (0.5 + aSeed.y) + span * 0.5, span) - span * 0.5;
    p.x += sin(uTime * 0.18 + aSeed.x * 6.2831) * 0.25;
    // Cada luz tem a sua distância, então passa num ritmo próprio: é o que dá volume ao salão.
    p.z = mod(p.z + uTravel * (0.75 + aSeed.w * 0.5), ${BOKEH_DEPTH.toFixed(1)}) + (${BOKEH_FAR.toFixed(1)});
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = min((10.0 + aSeed.z * 34.0) * uScale * uDpr * (${CAMERA_Z}.0 / -mv.z), 150.0 * uDpr);
    float fade = smoothstep(${BOKEH_FAR.toFixed(1)}, ${(BOKEH_FAR + 8).toFixed(1)}, p.z);
    fade *= 1.0 - smoothstep(${(BOKEH_NEAR - 2.5).toFixed(1)}, ${BOKEH_NEAR.toFixed(1)}, p.z);
    vTwinkle = (0.75 + 0.25 * sin(uTime * (0.6 + aSeed.y) + aSeed.x * 20.0)) * fade;
    gl_Position = projectionMatrix * mv;
  }
`;

const BOKEH_FRAG = /* glsl */ `
  precision highp float;
  ${FIELD_GLSL}
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // Círculo de lente: miolo suave e aro um pouco mais claro.
    float disk = smoothstep(1.0, 0.82, d);
    float rim = smoothstep(0.55, 0.92, d) * disk;
    float edge;
    vec3 w = fieldAt(gl_FragCoord.xy, edge);
    vec3 col = w.x * vec3(0.78, 0.56, 0.36) + w.y * vec3(1.0, 0.88, 0.72) + w.z * vec3(1.0, 0.84, 0.58);
    // Só nos fundos escuros: sobre o creme, os círculos pareceriam manchas.
    float strength = w.y * 0.1 + w.z * 0.34;
    if (strength < 0.01) discard;
    gl_FragColor = vec4(col, (disk * 0.55 + rim * 0.45) * strength * vTwinkle);
  }
`;

/** Onde as fitas ficam em cada cena: [altura, amplitude, inclinação, curva], [largura, torção, profundidade, espaçamento], opacidade. */
const PRESETS: { shape: [number, number, number, number]; form: [number, number, number, number]; alpha: number }[] = [
  // 0 abertura: onda baixa subindo para a direita, por trás da foto.
  { shape: [-0.8, 0.13, 0.26, 0], form: [1.05, 2.2, -1.8, 0.2], alpha: 0.95 },
  // 1 destaques e Sobre: faixa rente ao pé da tela.
  { shape: [-1.12, 0.08, -0.05, 0], form: [0.85, 1.8, -2.2, 0.12], alpha: 0.9 },
  // 2 processo: fios dourados finos no alto, como cordões de luz.
  { shape: [0.84, 0.09, -0.05, 0], form: [0.34, 5.0, -2.6, 0.09], alpha: 0.95 },
  // 3 orçamento e contato: drapeado de teto, caindo em curva no meio.
  { shape: [1.16, 0.05, 0, -0.24], form: [0.85, 2.4, -2.4, 0.11], alpha: 0.9 },
];

type Section = { el: HTMLElement; flag: number; scene: number };

export type SceneHandle = { destroy: () => void };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = window.innerWidth < 768;
  const ribbonCount = small ? 2 : 3;
  const bokehCount = small ? 60 : 150;
  const archCount = small ? 6 : 8;
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
    uWind: { value: 0 },
    uTravel: { value: 0 },
    uHalfW: { value: 1 },
    uHalfH: { value: 1 },
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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);

  // Galeria de arcos: dois filetes (o de fora mais fino, como as molduras da página), repetidos ao longo do salão.
  const ARCH_STEPS = 72;
  const archPos: number[] = [];
  const archIndex: number[] = [];
  for (const [line, offset] of [0, 0.17].entries()) {
    const start = line * (ARCH_STEPS + 1) * 2;
    for (let i = 0; i <= ARCH_STEPS; i++) {
      archPos.push(i / ARCH_STEPS, -1, offset, i / ARCH_STEPS, 1, offset);
      if (i < ARCH_STEPS) {
        const a = start + i * 2;
        archIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  }
  const archZ = Array.from({ length: archCount }, (_, i) => (i * HALL_DEPTH) / archCount);
  const archGeo = new THREE.InstancedBufferGeometry();
  archGeo.setAttribute("position", new THREE.Float32BufferAttribute(archPos, 3));
  archGeo.setIndex(archIndex);
  archGeo.setAttribute("aZ", new THREE.InstancedBufferAttribute(new Float32Array(archZ), 1));
  archGeo.instanceCount = archCount;
  const archMat = new THREE.ShaderMaterial({
    vertexShader: ARCH_VERT,
    fragmentShader: ARCH_FRAG,
    uniforms: shared,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const arches = new THREE.Mesh(archGeo, archMat);
  arches.frustumCulled = false;
  arches.renderOrder = -1;
  scene.add(arches);

  // Cortinas de voil, uma de cada lado de cada arco.
  const curtainGeo = new THREE.InstancedBufferGeometry();
  const curtainPlane = new THREE.PlaneGeometry(1, 1, 16, 24);
  curtainGeo.setAttribute("position", curtainPlane.getAttribute("position"));
  curtainGeo.setIndex(curtainPlane.getIndex());
  curtainGeo.setAttribute("aZ", new THREE.InstancedBufferAttribute(new Float32Array(archZ.flatMap((z) => [z, z])), 1));
  curtainGeo.setAttribute("aSide", new THREE.InstancedBufferAttribute(new Float32Array(archZ.flatMap(() => [-1, 1])), 1));
  curtainGeo.instanceCount = archCount * 2;
  const curtainMat = new THREE.ShaderMaterial({
    vertexShader: CURTAIN_VERT,
    fragmentShader: CURTAIN_FRAG,
    uniforms: shared,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const curtains = new THREE.Mesh(curtainGeo, curtainMat);
  curtains.frustumCulled = false;
  curtains.renderOrder = -2;
  scene.add(curtains);

  // Luzes desfocadas
  const r = rng(384753);
  const bokehPos = new Float32Array(bokehCount * 3);
  const bokehSeed = new Float32Array(bokehCount * 4);
  for (let i = 0; i < bokehCount; i++) {
    bokehPos[i * 3] = (r() * 2 - 1) * 15;
    bokehPos[i * 3 + 1] = (r() * 2 - 1) * 8;
    bokehPos[i * 3 + 2] = r() * BOKEH_DEPTH;
    bokehSeed.set([r(), r(), Math.pow(r(), 2), r()], i * 4);
  }
  const bokehGeo = new THREE.BufferGeometry();
  bokehGeo.setAttribute("position", new THREE.Float32BufferAttribute(bokehPos, 3));
  bokehGeo.setAttribute("aSeed", new THREE.Float32BufferAttribute(bokehSeed, 4));
  const bokehMat = new THREE.ShaderMaterial({
    vertexShader: BOKEH_VERT,
    fragmentShader: BOKEH_FRAG,
    uniforms: { ...shared, uScale: { value: small ? 0.8 : 1 } },
    transparent: true,
    depthWrite: false,
  });
  const bokeh = new THREE.Points(bokehGeo, bokehMat);
  bokeh.frustumCulled = false;
  scene.add(bokeh);

  // Fitas de seda
  const ribbonShared = {
    uShape: { value: new THREE.Vector4(...PRESETS[0].shape) },
    uForm: { value: new THREE.Vector4(...PRESETS[0].form) },
    uAlpha: { value: PRESETS[0].alpha },
    uRibbons: { value: ribbonCount },
    uPointerW: { value: new THREE.Vector2(99, 99) },
  };
  const ribbonGeo = new THREE.PlaneGeometry(1, 1, small ? 120 : 220, 18);
  const ribbonMats: THREE.ShaderMaterial[] = [];
  for (let i = 0; i < ribbonCount; i++) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: RIBBON_VERT,
      fragmentShader: RIBBON_FRAG,
      uniforms: {
        ...shared,
        ...ribbonShared,
        uIndex: { value: i },
        uSeed: { value: [0.13, 0.57, 0.82][i] },
        uTone: { value: [0.15, 0.85, 0.45][i] },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    ribbonMats.push(mat);
    const mesh = new THREE.Mesh(ribbonGeo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = i;
    scene.add(mesh);
  }

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    shared.uRes.value.set(w * dpr, h * dpr);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    shared.uHalfH.value = CAMERA_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
    shared.uHalfW.value = shared.uHalfH.value * camera.aspect;
  }
  layout();

  // Seções da página atual (a lista muda quando a rota muda).
  let sections: Section[] = [];
  function collect() {
    sections = [...document.querySelectorAll<HTMLElement>("[data-bg]")].slice(0, MAX_SECTIONS).map((el) => ({
      el,
      flag: el.dataset.bg === "brand" ? 1 : el.dataset.bg === "noir" ? 2 : 0,
      scene: Number(el.dataset.scene ?? 0),
    }));
  }
  collect();
  const mo = new MutationObserver(collect);
  mo.observe(document.body, { childList: true, subtree: true });

  // Ponteiro
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const origin = new THREE.Vector2();
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
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
      renderer.setPixelRatio(dpr);
      shared.uDpr.value = dpr;
      layout();
    }, 120);
  };
  window.addEventListener("resize", onResize);

  let mix = -1;
  let lastScroll = window.scrollY;
  let wind = 0;
  let travel = (lastScroll / window.innerHeight) * TRAVEL_PER_SCREEN;
  let raf = 0;
  let last = performance.now();
  let time = 0;
  const shape = new THREE.Vector4();
  const form = new THREE.Vector4();
  const tmp = new THREE.Vector4();

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!opts.reducedMotion) time += dt;
    shared.uTime.value = time;

    const center = window.innerHeight * 0.5;
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
        const blend = next ? smooth(0.55, 1, t) : 0;
        target = s.scene + ((next?.scene ?? s.scene) - s.scene) * blend;
      }
    }
    shared.uCount.value = n;

    if (mix < 0 || opts.reducedMotion) mix = target;
    else mix += (target - mix) * (1 - Math.exp(-dt * 1.8));

    // As fitas deslizam de uma cena para a outra e, no meio do caminho, ondulam e torcem mais.
    const i0 = Math.min(Math.floor(mix), PRESETS.length - 2);
    const f = smooth(0, 1, mix - i0);
    const a = PRESETS[i0];
    const b = PRESETS[i0 + 1];
    shape.fromArray(a.shape).lerp(tmp.fromArray(b.shape), f);
    form.fromArray(a.form).lerp(tmp.fromArray(b.form), f);
    const swirl = Math.sin(f * Math.PI);
    shape.y += swirl * 0.18;
    form.y += swirl * 2.2;
    // Em tela em pé, as fitas ficam mais finas para não cobrir o texto.
    if (camera.aspect < 0.85) form.x *= 0.5;
    ribbonShared.uShape.value.copy(shape);
    ribbonShared.uForm.value.copy(form);
    ribbonShared.uAlpha.value = a.alpha + (b.alpha - a.alpha) * f;

    const scroll = window.scrollY;
    const v = Math.abs(scroll - lastScroll) / Math.max(dt, 0.001);
    lastScroll = scroll;
    wind += (Math.min(v / 2500, 1) - wind) * (1 - Math.exp(-dt * 3));
    shared.uWind.value = opts.reducedMotion ? 0 : wind;
    // Um leve atraso sobre a rolagem: a câmera tem peso e assenta depois que a página para.
    travel += ((scroll / window.innerHeight) * TRAVEL_PER_SCREEN - travel) * (1 - Math.exp(-dt * 5));
    shared.uTravel.value = travel;

    pointer.lerp(pointerActive ? pointerTarget : origin, 1 - Math.exp(-dt * 4));
    bgMat.uniforms.uPointer.value.copy(pointer);
    if (pointerActive) ribbonShared.uPointerW.value.set(pointer.x * shared.uHalfW.value, pointer.y * shared.uHalfH.value);
    else ribbonShared.uPointerW.value.set(99, 99);

    // A câmera faz uma curva suave pelo salão, inclina um pouco nela e abre o campo de visão ao acelerar.
    camera.position.x = pointer.x * 0.35 + Math.sin(travel * 0.11) * 0.5;
    camera.position.y = pointer.y * 0.22 + Math.sin(travel * 0.07) * 0.16;
    camera.up.set(Math.sin(travel * 0.11 - 0.5) * 0.03, 1, 0);
    camera.lookAt(Math.sin(travel * 0.11 - 0.5) * 0.55, 0, -1);
    camera.fov = FOV + shared.uWind.value * 7;
    camera.updateProjectionMatrix();

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
      archGeo.dispose();
      archMat.dispose();
      curtainPlane.dispose();
      curtainGeo.dispose();
      curtainMat.dispose();
      ribbonGeo.dispose();
      ribbonMats.forEach((m) => m.dispose());
      bokehGeo.dispose();
      bokehMat.dispose();
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
