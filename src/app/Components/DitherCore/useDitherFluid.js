import { useEffect, useRef } from "react";
import * as THREE from "three";
import { VERT, FRAG } from "./ditherShader";

const FLUID_W = 60;
const FLUID_H = 60;
const VISCOSITY = 0.985;
const DYE_DECAY = 0.965;

export default function useDitherFluid({
  wrapperRef,
  canvasRef,
  getSourceTexture,
  onResize,
  pixelSize = 10,
  ditherSize = 10,
  distortStrength = 20,
  splatRadius = 2,
  ditherColor = null,
  hoverRadius = 6,
  colorNum = 4,
  onReady,
  deps = [],
}) {
  const rafRef = useRef(null);
  const fluidTexRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const prevMouseRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  const fluidRef = useRef({
    velX: new Float32Array(FLUID_W * FLUID_H),
    velY: new Float32Array(FLUID_W * FLUID_H),
    velXn: new Float32Array(FLUID_W * FLUID_H),
    velYn: new Float32Array(FLUID_W * FLUID_H),
    dye: new Float32Array(FLUID_W * FLUID_H),
    dyeN: new Float32Array(FLUID_W * FLUID_H),
    pixels: new Uint8Array(FLUID_W * FLUID_H * 4),
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    // touch devices disable
    const isTouchDevice =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(hover: none), (pointer: coarse)").matches ||
        "ontouchstart" in window);
    if (isTouchDevice) {
      wrapper.classList.add("is-touch");
      return;
    }
    wrapper.classList.remove("is-touch");

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();

    const sourceTexture = getSourceTexture();

    const fluid = fluidRef.current;
    const fluidTexture = new THREE.DataTexture(
      fluid.pixels,
      FLUID_W,
      FLUID_H,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
    );
    fluidTexture.minFilter = THREE.LinearFilter;
    fluidTexture.magFilter = THREE.LinearFilter;
    fluidTexture.needsUpdate = true;
    fluidTexRef.current = fluidTexture;

    const ditherColorVec = ditherColor
      ? new THREE.Color().setStyle(ditherColor, THREE.SRGBColorSpace)
      : null;

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSource: { value: sourceTexture },
        uFluid: { value: fluidTexture },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPixelSize: { value: pixelSize },
        uDitherSize: { value: ditherSize },
        uDistortStrength: { value: distortStrength },
        uColorNum: { value: Math.max(2, colorNum) },
        uDitherColor: {
          value: ditherColorVec
            ? new THREE.Vector3(
                ditherColorVec.r,
                ditherColorVec.g,
                ditherColorVec.b,
              )
            : new THREE.Vector3(0, 0, 0),
        },
        uUseDitherColor: { value: ditherColorVec ? 1 : 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const camera = new THREE.Camera();

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setSize(w, h, false);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w, h, dpr };
      onResize?.(w, h, dpr);
      material.uniforms.uResolution.value.set(w, h);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const gi = (x, y) => y * FLUID_W + x;

    const addSplat = (nx, ny, fx, fy, strength) => {
      const gx = toCell(nx, FLUID_W);
      const gy = toCell(ny, FLUID_H);
      const r = splatRadius;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const cx = gx + dx;
          const cy = gy + dy;
          if (cx < 0 || cx >= FLUID_W || cy < 0 || cy >= FLUID_H) continue;
          const w = Math.exp(-((dx * dx + dy * dy) / (r * r)) * 3);
          const i = gi(cx, cy);
          fluid.velX[i] += fx * strength * w;
          fluid.velY[i] += fy * strength * w;
          fluid.dye[i] = Math.min(1, fluid.dye[i] + w * 0.9);
        }
      }
    };

    // advect every cell (borders included) and clamp samples to the grid, so
    // edges/corners keep their dye instead of being zeroed by untouched border cells
    const advect = (field, fieldOut, vx, vy, dt, decay) => {
      for (let y = 0; y < FLUID_H; y++) {
        for (let x = 0; x < FLUID_W; x++) {
          const i = gi(x, y);
          const sx = Math.max(
            0,
            Math.min(FLUID_W - 1, x - vx[i] * dt * FLUID_W),
          );
          const sy = Math.max(
            0,
            Math.min(FLUID_H - 1, y - vy[i] * dt * FLUID_H),
          );
          const x0 = Math.floor(sx);
          const y0 = Math.floor(sy);
          const x1 = Math.min(x0 + 1, FLUID_W - 1);
          const y1 = Math.min(y0 + 1, FLUID_H - 1);
          const tx = sx - x0;
          const ty = sy - y0;
          fieldOut[i] =
            decay *
            ((1 - tx) * (1 - ty) * field[gi(x0, y0)] +
              tx * (1 - ty) * field[gi(x1, y0)] +
              (1 - tx) * ty * field[gi(x0, y1)] +
              tx * ty * field[gi(x1, y1)]);
        }
      }
    };

    const stepFluid = (dt) => {
      advect(fluid.velX, fluid.velXn, fluid.velX, fluid.velY, dt, VISCOSITY);
      advect(fluid.velY, fluid.velYn, fluid.velX, fluid.velY, dt, VISCOSITY);
      fluid.velX.set(fluid.velXn);
      fluid.velY.set(fluid.velYn);
      advect(fluid.dye, fluid.dyeN, fluid.velX, fluid.velY, dt, DYE_DECAY);
      fluid.dye.set(fluid.dyeN);
    };

    const uploadFluidTexture = () => {
      const px = fluid.pixels;
      for (let i = 0; i < FLUID_W * FLUID_H; i++) {
        const vx = Math.max(-1, Math.min(1, fluid.velX[i]));
        const vy = Math.max(-1, Math.min(1, fluid.velY[i]));
        px[i * 4] = Math.round((vx * 0.5 + 0.5) * 255);
        px[i * 4 + 1] = Math.round((vy * 0.5 + 0.5) * 255);
        px[i * 4 + 2] = Math.round(Math.min(1, fluid.dye[i]) * 255);
        px[i * 4 + 3] = 255;
      }
      fluidTexRef.current.needsUpdate = true;
    };

    const toCell = (n, size) =>
      Math.max(0, Math.min(size - 1, Math.floor(n * size)));

    const saturateAtCursor = (nx, ny) => {
      const gx = toCell(nx, FLUID_W);
      const gy = toCell(ny, FLUID_H);
      // loop over whole cells; a fractional radius (e.g. 0.4) would otherwise
      // produce fractional indices and silently write nothing
      const r = Math.max(hoverRadius, 0.0001);
      const ri = Math.ceil(r);
      for (let dy = -ri; dy <= ri; dy++) {
        for (let dx = -ri; dx <= ri; dx++) {
          const cx = gx + dx;
          const cy = gy + dy;
          if (cx < 0 || cx >= FLUID_W || cy < 0 || cy >= FLUID_H) continue;
          const distNorm = Math.sqrt(dx * dx + dy * dy) / r;
          if (distNorm > 1) continue;
          const i = gi(cx, cy);
          const target = 1.0 - distNorm * 0.3;
          fluid.dye[i] = Math.max(fluid.dye[i], target);
        }
      }
    };

    const handleMouseMove = (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = x / rect.width;
      const ny = 1 - y / rect.height;
      mouseRef.current = { x, y, nx, ny, active: true };

      const prev = prevMouseRef.current;
      if (prev) {
        const fdx = nx - prev.x;
        const fdy = ny - prev.y;
        const speed = Math.sqrt(fdx * fdx + fdy * fdy);
        if (speed > 0.0005) {
          addSplat(nx, ny, fdx * 18, fdy * 18, Math.min(speed * 200, 3));
        }
      }
      prevMouseRef.current = { x: nx, y: ny };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      prevMouseRef.current = null;
    };

    wrapper.addEventListener("mousemove", handleMouseMove);
    wrapper.addEventListener("mouseleave", handleMouseLeave);

    let lastTime = performance.now();

    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      stepFluid(dt);
      if (mouseRef.current.active) {
        saturateAtCursor(mouseRef.current.nx, mouseRef.current.ny);
      }
      uploadFluidTexture();

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    onReady?.(() => {
      resize();
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      wrapper.removeEventListener("mousemove", handleMouseMove);
      wrapper.removeEventListener("mouseleave", handleMouseLeave);
      geometry.dispose();
      material.dispose();
      fluidTexture.dispose();
      sourceTexture.dispose();
      renderer.dispose();
    };
  }, [
    pixelSize,
    ditherSize,
    distortStrength,
    splatRadius,
    ditherColor,
    hoverRadius,
    colorNum,
    ...deps,
  ]);
}
