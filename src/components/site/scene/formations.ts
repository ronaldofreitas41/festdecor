/**
 * As quatro formas que as pétalas assumem conforme a página desce:
 * 0 chuva de pétalas, 1 guirlanda, 2 varal de luzes, 3 arco de flores.
 * Coordenadas em unidades do mundo; `halfH`/`halfW` são a metade da área visível no plano z = 0.
 */
export type Frame = { halfW: number; halfH: number; portrait: boolean };

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

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() || 1e-6)) * Math.cos(2 * Math.PI * r());
}

export function buildFormations(count: number, { halfW, halfH, portrait }: Frame) {
  const r = rng(384753);
  const f0 = new Float32Array(count * 3);
  const f1 = new Float32Array(count * 3);
  const f2 = new Float32Array(count * 3);
  const f3 = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);

  // Arco: flores em cachos ao longo de um semicírculo.
  const archR = Math.min(halfW * 0.86, halfH * 1.25);
  const archY = -halfH * 0.95;
  const clusters = Array.from({ length: 110 }, (_, i) => {
    const a = Math.PI * (i / 109) + gauss(r) * 0.02;
    const rr = archR + gauss(r) * 0.14;
    return [Math.cos(a) * rr, archY + Math.sin(a) * rr * 1.08, -0.6 + gauss(r) * 0.25];
  });

  // Varal: fios em catenária, do fundo para a frente, e alguns fios caindo como cortina.
  const strands = 8;

  for (let i = 0; i < count; i++) {
    const k = i * 3;
    seed[i * 4] = r(); // fase
    seed[i * 4 + 1] = 0.6 + r() * 0.8; // velocidade
    seed[i * 4 + 2] = 0.65 + r() * 0.7; // tamanho
    seed[i * 4 + 3] = r(); // cor / folha

    // 0: chuva leve, mais densa nas bordas e ao fundo.
    const edge = r() < 0.5 ? -1 : 1;
    f0[k] = portrait ? (r() * 2 - 1) * halfW * 1.6 : edge * (0.25 + Math.pow(r(), 0.8) * 1.15) * halfW;
    f0[k + 1] = (r() * 2 - 1) * 6;
    f0[k + 2] = -8 + r() * 10;

    // 1: guirlanda em hélice atravessando a tela.
    const t = r();
    const len = portrait ? halfH * 1.25 : halfW * 1.25;
    const along = (t * 2 - 1) * len;
    const theta = t * Math.PI * 7 + gauss(r) * 0.35;
    const rad = 0.75 + Math.abs(gauss(r)) * 0.22;
    const wave = Math.sin(t * Math.PI * 2) * (portrait ? halfW * 0.25 : halfH * 0.18);
    const a1 = Math.sin(theta) * rad * 0.7 + wave;
    if (portrait) {
      f1[k] = a1 * 0.6 + halfW * 0.62;
      f1[k + 1] = along;
    } else {
      f1[k] = along;
      f1[k + 1] = a1;
    }
    f1[k + 2] = Math.cos(theta) * rad - 1.2;

    // 2: luzes.
    if (i % 5 < 3) {
      const s = i % strands;
      const n = Math.ceil(count / strands);
      const u = (Math.floor(i / strands) % n) / n;
      const z = -7 + (s / (strands - 1)) * 7;
      const depth = 1 + (-z / 9);
      const x = (u * 2 - 1) * halfW * 1.25 * depth;
      const top = halfH * (0.95 - (s % 4) * 0.12) * depth;
      const sag = halfH * (0.22 + (s % 3) * 0.08) * depth;
      f2[k] = x;
      f2[k + 1] = top - sag * (1 - Math.pow(u * 2 - 1, 2));
      f2[k + 2] = z;
    } else {
      const col = Math.floor(r() * 26);
      const z = -6 + (col % 5) * 0.4;
      const depth = 1 + (-z / 9);
      f2[k] = ((col / 25) * 2 - 1) * halfW * 1.15 * depth;
      f2[k + 1] = halfH * depth * (1 - r() * 1.6);
      f2[k + 2] = z;
    }

    // 3: arco de flores, com algumas pétalas caídas no chão.
    if (r() < 0.86) {
      const c = clusters[Math.floor(r() * clusters.length)];
      f3[k] = c[0] + gauss(r) * 0.11;
      f3[k + 1] = c[1] + gauss(r) * 0.11;
      f3[k + 2] = c[2] + gauss(r) * 0.11;
    } else {
      f3[k] = (r() * 2 - 1) * halfW * 1.1;
      f3[k + 1] = archY - 0.2 + gauss(r) * 0.12;
      f3[k + 2] = -1.5 + r() * 2.5;
    }
  }
  return { f0, f1, f2, f3, seed };
}
