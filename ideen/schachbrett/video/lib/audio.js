'use strict';
// Minimal offline DSP toolkit: buffers, filters, noise, reverb, ducking, limiting, WAV io.
const fs = require('fs');

const SR = 48000;

// ---------------------------------------------------------------- PRNG / noise
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- stereo bus
class Bus {
  constructor(seconds) {
    this.n = Math.ceil(seconds * SR) + SR; // 1s of headroom tail
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  // mono source -> stereo bus at time t (s), pan -1..1
  add(src, t, gain = 1, pan = 0) {
    const off = Math.round(t * SR);
    const gl = gain * Math.cos((pan + 1) * Math.PI / 4);
    const gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    const end = Math.min(src.length, this.n - off);
    if (off < 0 || end <= 0) return;
    for (let i = 0; i < end; i++) {
      const v = src[i];
      this.L[off + i] += v * gl;
      this.R[off + i] += v * gr;
    }
  }
  addStereo(bus, gain = 1) {
    const n = Math.min(this.n, bus.n);
    for (let i = 0; i < n; i++) { this.L[i] += bus.L[i] * gain; this.R[i] += bus.R[i] * gain; }
  }
  scale(g) { for (let i = 0; i < this.n; i++) { this.L[i] *= g; this.R[i] *= g; } }
  peak() {
    let p = 0;
    for (let i = 0; i < this.n; i++) {
      const a = Math.abs(this.L[i]), b = Math.abs(this.R[i]);
      if (a > p) p = a; if (b > p) p = b;
    }
    return p;
  }
  // multiply by a per-sample gain array (ducking automation)
  applyGain(g) {
    const n = Math.min(this.n, g.length);
    for (let i = 0; i < n; i++) { this.L[i] *= g[i]; this.R[i] *= g[i]; }
  }
  fadeOut(tStart, dur) {
    const a = Math.round(tStart * SR), b = Math.min(this.n, Math.round((tStart + dur) * SR));
    for (let i = a; i < b; i++) {
      const x = 1 - (i - a) / (b - a);
      const g = x * x;
      this.L[i] *= g; this.R[i] *= g;
    }
    for (let i = b; i < this.n; i++) { this.L[i] = 0; this.R[i] = 0; }
  }
  fadeIn(dur) {
    const b = Math.round(dur * SR);
    for (let i = 0; i < b && i < this.n; i++) { const g = i / b; this.L[i] *= g; this.R[i] *= g; }
  }
  trim(seconds) {
    const n = Math.min(this.n, Math.round(seconds * SR));
    const out = new Bus(0); out.n = n;
    out.L = this.L.subarray(0, n); out.R = this.R.subarray(0, n);
    return out;
  }
}

// ---------------------------------------------------------------- biquad (RBJ)
function biquad(type, f0, Q, gainDb = 0) {
  const w0 = 2 * Math.PI * f0 / SR, cw = Math.cos(w0), sw = Math.sin(w0);
  const alpha = sw / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  switch (type) {
    case 'lp': b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
    case 'hp': b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
    case 'bp': b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
    case 'peak': {
      const A = Math.pow(10, gainDb / 40);
      b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A;
      a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; break;
    }
    default: throw new Error('bad filter ' + type);
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function filt(buf, coef) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = coef.b0 * x + coef.b1 * x1 + coef.b2 * x2 - coef.a1 * y1 - coef.a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

// time-varying bandpass sweep (recomputes coefficients on a block grid)
function sweepBP(buf, fStart, fMid, fEnd, Q) {
  const out = new Float32Array(buf.length);
  const block = 64;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i += block) {
    const u = i / buf.length;
    const f = u < 0.5 ? fStart + (fMid - fStart) * (u / 0.5) : fMid + (fEnd - fMid) * ((u - 0.5) / 0.5);
    const c = biquad('bp', Math.max(60, Math.min(f, SR * 0.45)), Q);
    const end = Math.min(buf.length, i + block);
    for (let j = i; j < end; j++) {
      const x = buf[j];
      const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      out[j] = y;
    }
  }
  return out;
}

// ---------------------------------------------------------------- generators
function noise(dur, rng) {
  const n = Math.round(dur * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rng() * 2 - 1;
  return out;
}

// exponential decay envelope with soft attack
function env(buf, attack, decay, curve = 3.2) {
  const a = Math.max(1, Math.round(attack * SR));
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const atk = i < a ? i / a : 1;
    buf[i] *= atk * Math.exp(-curve * t / decay);
  }
  return buf;
}

// hann-ish window
function window_(buf, attack, release) {
  const a = Math.max(1, Math.round(attack * SR));
  const r = Math.max(1, Math.round(release * SR));
  const n = buf.length;
  for (let i = 0; i < n; i++) {
    let g = 1;
    if (i < a) g = 0.5 - 0.5 * Math.cos(Math.PI * i / a);
    const k = n - i;
    if (k < r) g *= 0.5 - 0.5 * Math.cos(Math.PI * k / r);
    buf[i] *= g;
  }
  return buf;
}

function mixInto(dst, src, gain = 1, offset = 0) {
  const end = Math.min(dst.length, src.length + offset);
  for (let i = Math.max(0, offset); i < end; i++) dst[i] += src[i - offset] * gain;
  return dst;
}

// ---------------------------------------------------------------- reverb (freeverb-ish, stereo)
function reverb(bus, { room = 0.72, damp = 0.35, wet = 0.22, width = 0.85 } = {}) {
  const k = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(v => Math.round(v * k));
  const aps = [556, 441, 341, 225].map(v => Math.round(v * k));
  const stereoSpread = Math.round(23 * k);
  const n = bus.n;
  const outL = new Float32Array(n), outR = new Float32Array(n);

  function chan(input, offset, out) {
    const cbuf = combs.map(d => ({ b: new Float32Array(d + offset), i: 0, f: 0, len: d + offset }));
    const abuf = aps.map(d => ({ b: new Float32Array(d + offset), i: 0, len: d + offset }));
    for (let i = 0; i < n; i++) {
      const x = input[i] * 0.015;
      let acc = 0;
      for (const c of cbuf) {
        const y = c.b[c.i];
        c.f = y * (1 - damp) + c.f * damp;
        c.b[c.i] = x + c.f * room;
        c.i = (c.i + 1) % c.len;
        acc += y;
      }
      for (const a of abuf) {
        const y = a.b[a.i];
        const v = acc + y * 0.5;
        a.b[a.i] = v;
        a.i = (a.i + 1) % a.len;
        acc = y - acc;
      }
      out[i] = acc;
    }
  }
  chan(bus.L, 0, outL);
  chan(bus.R, stereoSpread, outR);
  const dry = 1 - wet * 0.35;
  for (let i = 0; i < n; i++) {
    const l = outL[i], r = outR[i];
    bus.L[i] = bus.L[i] * dry + (l * width + r * (1 - width)) * wet;
    bus.R[i] = bus.R[i] * dry + (r * width + l * (1 - width)) * wet;
  }
  return bus;
}

// ---------------------------------------------------------------- ducking
// Envelope follower on a mono/stereo source -> gain curve for the music bus.
function duckCurve(srcL, srcR, { depthDb = -10, attack = 0.035, release = 0.34, thresh = 0.004 } = {}) {
  const n = srcL.length;
  const ga = Math.exp(-1 / (attack * SR));
  const gr = Math.exp(-1 / (release * SR));
  const curve = new Float32Array(n);
  let e = 0;
  const depth = Math.pow(10, depthDb / 20);
  for (let i = 0; i < n; i++) {
    const a = Math.abs(srcL[i]) + (srcR ? Math.abs(srcR[i]) : 0);
    e = a > e ? ga * e + (1 - ga) * a : gr * e + (1 - gr) * a;
    // map envelope to 0..1 "how much speech"
    const u = Math.min(1, Math.max(0, (e - thresh) / 0.09));
    const s = u * u * (3 - 2 * u);
    curve[i] = 1 + (depth - 1) * s;
  }
  return curve;
}

// ---------------------------------------------------------------- limiter
function limit(bus, ceiling = 0.89, lookahead = 0.005, release = 0.15) {
  const n = bus.n;
  const la = Math.max(1, Math.round(lookahead * SR));
  const gr = Math.exp(-1 / (release * SR));

  // required gain per sample
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]));
    need[i] = a > ceiling ? ceiling / a : 1;
  }
  // windowed minimum over [i, i+la] via monotonic deque -> gain starts falling `la` early
  const wmin = new Float32Array(n);
  const dq = new Int32Array(n + 1);
  let head = 0, tail = 0;
  for (let i = 0; i < n; i++) {
    const r = Math.min(n - 1, i + la);
    if (i === 0) {
      for (let j = 0; j <= r; j++) {
        while (tail > head && need[dq[tail - 1]] >= need[j]) tail--;
        dq[tail++] = j;
      }
    } else {
      if (r > Math.min(n - 1, i - 1 + la)) {
        while (tail > head && need[dq[tail - 1]] >= need[r]) tail--;
        dq[tail++] = r;
      }
      while (tail > head && dq[head] < i) head++;
    }
    wmin[i] = need[dq[head]];
  }
  // instant attack, smoothed release
  let s = 1;
  for (let i = 0; i < n; i++) {
    const t = wmin[i];
    s = t < s ? t : s * gr + t * (1 - gr);
    bus.L[i] *= s; bus.R[i] *= s;
  }
  return bus;
}

// ---------------------------------------------------------------- WAV io
function writeWav(path, bus, seconds) {
  const n = seconds ? Math.min(bus.n, Math.round(seconds * SR)) : bus.n;
  const bytes = n * 2 * 4;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + bytes, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(3, 20);          // IEEE float
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2 * 4, 28);
  header.writeUInt16LE(8, 32);
  header.writeUInt16LE(32, 34);
  header.write('data', 36);
  header.writeUInt32LE(bytes, 40);
  const data = Buffer.alloc(bytes);
  for (let i = 0; i < n; i++) {
    data.writeFloatLE(bus.L[i], i * 8);
    data.writeFloatLE(bus.R[i], i * 8 + 4);
  }
  fs.writeFileSync(path, Buffer.concat([header, data]));
  return n / SR;
}

function readF32(path) {
  const b = fs.readFileSync(path);
  const out = new Float32Array(b.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = b.readFloatLE(i * 4);
  return out;
}

module.exports = {
  SR, Bus, mulberry32, biquad, filt, sweepBP, noise, env, window_, mixInto,
  reverb, duckCurve, limit, writeWav, readF32,
};
