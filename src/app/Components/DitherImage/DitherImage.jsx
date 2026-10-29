import { useRef } from "react";
import * as THREE from "three";
import useDitherFluid from "../DitherCore/useDitherFluid";
import { loadImageWithCorsFallback } from "../../utils/corsImage";
import "./DitherImage.css";

export default function DitherImage({
  src,
  alt = "",
  as: Tag = "div",
  className = "",
  style = {},
  objectFit = "cover",
  pixelSize = 3,
  ditherSize = 0.2,
  distortStrength = 0.1,
  splatRadius = 3,
  ditherColor = null,
  hoverRadius = 0.4,
  colorNum = 9,
  ...rest
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const textureRef = useRef(null);
  const imgElRef = useRef(null);

  const drawImageTexture = (w, h, dpr) => {
    const sourceCanvas = sourceCanvasRef.current;
    const img = imgElRef.current;
    if (!sourceCanvas) return;

    const prevW = sourceCanvas.width;
    const prevH = sourceCanvas.height;
    sourceCanvas.width = w * dpr;
    sourceCanvas.height = h * dpr;
    // the GPU texture keeps the size it was first uploaded at; rebuild it when the canvas size changes
    if (sourceCanvas.width !== prevW || sourceCanvas.height !== prevH) {
      textureRef.current?.dispose();
    }

    const ctx = sourceCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!img || !img.complete || !img.naturalWidth) {
      if (textureRef.current) textureRef.current.needsUpdate = true;
      return;
    }

    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight,
      dx = 0,
      dy = 0,
      dw = w,
      dh = h;

    if (objectFit === "cover") {
      if (ir > cr) {
        sh = img.naturalHeight;
        sw = sh * cr;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sw = img.naturalWidth;
        sh = sw / cr;
        sy = (img.naturalHeight - sh) / 2;
      }
    } else if (objectFit === "contain") {
      if (ir > cr) {
        dw = w;
        dh = w / ir;
        dy = (h - dh) / 2;
      } else {
        dh = h;
        dw = h * ir;
        dx = (w - dw) / 2;
      }
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  useDitherFluid({
    wrapperRef,
    canvasRef,
    getSourceTexture: () => {
      const texture = new THREE.CanvasTexture(sourceCanvasRef.current);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      textureRef.current = texture;
      return texture;
    },
    onResize: (w, h, dpr) => drawImageTexture(w, h, dpr),
    onReady: (redraw) => {
      loadImageWithCorsFallback(src)
        .then((img) => {
          imgElRef.current = img;
          redraw();
        })
        .catch((err) => {
          console.error("DitherImage: failed to load image", src, err);
        });
    },
    pixelSize,
    ditherSize,
    distortStrength,
    splatRadius,
    ditherColor,
    hoverRadius,
    colorNum,
    deps: [src, objectFit],
  });

  return (
    <Tag
      ref={wrapperRef}
      className={`dither-image ${className}`}
      style={style}
      {...rest}
    >
      <img
        src={src}
        alt={alt}
        className="dither-image-content"
        style={{ objectFit }}
        aria-hidden="true"
      />
      <canvas ref={sourceCanvasRef} className="dither-image-source" />
      <canvas ref={canvasRef} className="dither-image-canvas" />
    </Tag>
  );
}
