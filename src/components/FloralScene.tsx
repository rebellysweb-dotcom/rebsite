/**
 * FloralScene — vanilla Three.js petal field, no React-Three-Fiber.
 * Loaded lazily by FloralCanvas so Three.js stays out of the main bundle.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* Brand palette */
const PALETTE: { hex: string; weight: number; alpha: [number, number] }[] = [
  { hex: '#e91e8c', weight: 0.14, alpha: [0.40, 0.55] },
  { hex: '#f8aed6', weight: 0.34, alpha: [0.45, 0.70] },
  { hex: '#fcd8ec', weight: 0.32, alpha: [0.55, 0.80] },
  { hex: '#c9a84c', weight: 0.20, alpha: [0.40, 0.60] },
];

const FOCUS_DEPTH = 10;

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function makePetalGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.42, -0.32, 0.4, 0.3, 0.07, 0.5);
  s.quadraticCurveTo(0, 0.43, -0.07, 0.5);
  s.bezierCurveTo(-0.4, 0.3, -0.42, -0.32, 0, -0.5);
  const g = new THREE.ShapeGeometry(s, 10);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, x * x * 0.9 - (y + 0.5) * 0.08);
  }
  return g;
}

const vertexShader = /* glsl */`
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uDof;
  varying vec2 vLocal;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBlur;
  void main() {
    vLocal = position.xy;
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vBlur = uDof * clamp(abs(-mv.z - ${FOCUS_DEPTH.toFixed(1)}) / 6.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */`
  varying vec2 vLocal;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBlur;
  void main() {
    float d = length(vLocal * vec2(1.25, 1.0)) / 0.5;
    float soft = mix(0.32, 0.9, vBlur);
    float a = vAlpha * (1.0 - smoothstep(1.0 - soft, 1.04, d));
    a *= mix(1.0, 0.6, vBlur);
    float vein = (1.0 - smoothstep(0.0, 0.06, abs(vLocal.x))) * (0.5 - vLocal.y) * 0.14;
    vec3 c = min(vColor + vein + 0.07 * (1.0 - d), vec3(1.0));
    gl_FragColor = vec4(c, a);
  }
`;

export default function FloralScene({
  mobile,
  onReady,
}: {
  mobile: boolean;
  onReady: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = mobile ? 100 : 280;
    const dpr = mobile ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5);

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(dpr);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // ── Scene / Camera ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 40);
    camera.position.set(0, 0, FOCUS_DEPTH);

    // ── Geometry + Material ───────────────────────────────────────────────
    const rand = mulberry32(1990);
    const geometry = makePetalGeometry();

    const base = new Float32Array(count * 10);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const o = i * 10;
      base[o + 0] = rand() * 2 - 1;
      base[o + 1] = rand() * 2 - 1;
      base[o + 2] = -4.5 + rand() * 6.5;
      base[o + 3] = rand() * Math.PI * 2;
      base[o + 4] = 0.012 + rand() * 0.022;
      base[o + 5] = 0.15 + rand() * 0.45;
      base[o + 6] = (rand() - 0.5) * 0.5;
      base[o + 7] = (rand() - 0.5) * 0.6;
      base[o + 8] = (rand() - 0.5) * 0.35;
      base[o + 9] = 0.14 + Math.pow(rand(), 2) * 0.2;

      let r = rand();
      let pick = PALETTE[PALETTE.length - 1];
      for (const p of PALETTE) { if ((r -= p.weight) <= 0) { pick = p; break; } }
      const [cr, cg, cb] = hexToRgb(pick.hex);
      colors.set([cr, cg, cb], i * 3);
      alphas[i] = pick.alpha[0] + rand() * (pick.alpha[1] - pick.alpha[0]);
    }

    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
    geometry.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uDof: { value: mobile ? 0 : 1 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // ── Scroll tracking ───────────────────────────────────────────────────
    const scroll = { y: 0 };
    const onScroll = () => { scroll.y = window.scrollY; };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Resize observer ───────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);

    // ── Animation loop ────────────────────────────────────────────────────
    const dummy = new THREE.Object3D();
    const sim = { t: 0, swirl: 0, swirlV: 0, spin: 0, lastY: -1 };
    let raf = 0;
    let last = 0;
    const FPS = 60;
    const step = 1000 / FPS;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < step - 1.5) return;
      const rawDelta = (now - last) / 1000;
      last = now;
      const dt = Math.min(rawDelta, 1 / 30);

      if (sim.lastY < 0) sim.lastY = scroll.y;
      const vel = (scroll.y - sim.lastY) / Math.max(dt, 1e-3);
      sim.lastY = scroll.y;
      const target = THREE.MathUtils.clamp(vel / 1800, -1, 1);
      const k = 18, c = 7;
      sim.swirlV += (k * (target - sim.swirl) - c * sim.swirlV) * dt;
      sim.swirl += sim.swirlV * dt;
      sim.spin += sim.swirl * dt * 0.8;
      sim.t += dt;

      const t = sim.t;
      const vFov = (camera.fov * Math.PI) / 180;
      const dist = FOCUS_DEPTH;
      const hh = Math.tan(vFov / 2) * dist * 1.12;
      const hw = hh * camera.aspect * 1.12;
      const radial = 1 - 0.2 * sim.swirl;

      for (let i = 0; i < count; i++) {
        const o = i * 10;
        const ph = base[o + 3];
        let ny = base[o + 1] - t * base[o + 4];
        ny = ((((ny + 1) % 2) + 2) % 2) - 1;
        let x = base[o] * hw + Math.sin(t * 0.32 + ph) * base[o + 5] + Math.sin(ny * 3.1 + ph * 0.7) * 0.28;
        let y = ny * hh + Math.sin(t * 0.21 + ph * 1.3) * 0.12;
        const z = base[o + 2] + Math.sin(t * 0.17 + ph) * 0.3;
        const rr = Math.hypot(x, y);
        const a = Math.atan2(y, x) + sim.spin * (1.4 / (1 + rr * 0.35));
        x = Math.cos(a) * rr * radial;
        y = Math.sin(a) * rr * radial;
        dummy.position.set(x, y, z);
        dummy.rotation.set(
          ph + t * base[o + 6] + Math.sin(t * 0.6 + ph) * 0.35,
          ph * 1.3 + t * base[o + 7],
          ph + t * base[o + 8] + sim.swirl * 0.5,
        );
        dummy.scale.setScalar(base[o + 9]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);
    requestAnimationFrame(() => onReady());

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [mobile, onReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
