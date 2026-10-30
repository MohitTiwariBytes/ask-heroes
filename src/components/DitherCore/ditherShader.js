export const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uSource;
  uniform sampler2D uFluid; // rg = velocity (signed, encoded 0..1), b = dye
  uniform vec2 uResolution;
  uniform float uPixelSize;
  uniform float uDitherSize;
  uniform float uDistortStrength;
  uniform float uColorNum;
  uniform vec3 uDitherColor;
  uniform float uUseDitherColor;

  const mat4 bayerMatrix4x4 = mat4(
    0.0,  8.0,  2.0, 10.0,
    12.0, 4.0,  14.0, 6.0,
    3.0,  11.0, 1.0, 9.0,
    15.0, 7.0,  13.0, 5.0
  ) / 16.0;

  float bayerValue(vec2 pos, float cellSize) {
    ivec2 p = ivec2(mod(floor(pos / max(cellSize, 1.0)), 4.0));
    return bayerMatrix4x4[p.y][p.x];
  }

  vec3 quantize(vec3 color, float n) {
    return floor(color * (n - 1.0) + 0.5) / (n - 1.0);
  }

  void main() {
    vec2 fragCoord = vUv * uResolution;

    vec4 fluidSample = texture2D(uFluid, vUv);
    vec2 vel = fluidSample.rg * 2.0 - 1.0;
    float mask = clamp(fluidSample.b, 0.0, 1.0);

    // Pixel-push distortion driven by the fluid velocity, localized to
    // the dye mask so it only warps where the water-like reveal is.
    // Sample from behind the motion (negated) so the visible push follows
    // the cursor's direction instead of appearing to lag opposite it.
    vec2 disp = -vel * uDistortStrength * mask;

    // Pixelate within the masked area so the effect reads as visible
    // blocks instead of a per-pixel warp. Independent from the dither
    // cell size below -- one controls the distortion's blockiness, the
    // other the dither pattern's grain.
    float pixelSize = mix(1.0, uPixelSize, mask);
    vec2 pixelatedCoord = floor(fragCoord / pixelSize) * pixelSize;
    vec2 sampleUv = pixelatedCoord / uResolution + disp;

    vec4 tex = texture2D(uSource, mix(vUv, sampleUv, mask));
    if (tex.a < 0.02) discard;

    // Ordered dithering + color quantization: add the Bayer threshold as
    // dither noise before quantizing each channel to uColorNum levels, so
    // gradients read as a proper dither pattern instead of a hard on/off
    // per-pixel cutoff.
    float threshold = (bayerValue(fragCoord, uDitherSize) - 0.5) / uColorNum;
    vec3 dithered = quantize(tex.rgb + threshold, uColorNum);

    if (uUseDitherColor > 0.5) {
      float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
      dithered = mix(vec3(0.0), uDitherColor, lum);
    }

    vec3 finalColor = mix(tex.rgb, dithered, mask);
    gl_FragColor = vec4(finalColor, tex.a);
  }
`;
