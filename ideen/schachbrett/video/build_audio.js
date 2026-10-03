'use strict';
// Builds cache/timeline_<lang>.json and cache/master_<lang>.wav
// Narration (edge-tts) + procedural score + procedural foley, ducked and limited.

const fs = require('fs');
const path = require('path');
const A = require('./lib/audio');
const S = require('./lib/synth');
const { SR, Bus, mulberry32, biquad, filt, reverb, duckCurve, limit, writeWav, readF32 } = A;

const ROOT = __dirname;
const BPM = 112;
const SPB = 60 / BPM;            // seconds per quarter note
const BAR = 4 * SPB;             // 2.143 s
const TAIL = 1.8;

// ----------------------------------------------------------------- timeline
function buildTimeline(lang) {
  const nar = JSON.parse(fs.readFileSync(path.join(ROOT, 'cache', `narration_${lang}.json`), 'utf8'));
  let t = 0;
  const lines = nar.lines.map(l => {
    const o = { i: l.i, beat: l.beat, text: l.text, start: +t.toFixed(4), dur: l.dur, end: +(t + l.dur).toFixed(4) };
    t += l.dur + l.pause;
    return o;
  });
  const beats = nar.beats.map((b, bi) => {
    const ls = b.lines.map(i => lines[i]);
    const start = ls[0].start;
    const last = ls[ls.length - 1];
    // a beat owns the pause that follows its last line (except the final one)
    const nextStart = bi + 1 < nar.beats.length ? lines[nar.beats[bi + 1].lines[0]].start : last.end + TAIL;
    return {
      id: b.id, i: bi, start, end: +nextStart.toFixed(4),
      dur: +(nextStart - start).toFixed(4), lines: b.lines,
      speechEnd: last.end,
    };
  });
  const speechEnd = lines[lines.length - 1].end;
  return {
    lang, voice: nar.voice, title: nar.title, bpm: BPM,
    speechEnd: +speechEnd.toFixed(4),
    total: +(speechEnd + TAIL).toFixed(4),
    lines, beats,
  };
}

// helpers to address the timeline from choreography code
function mk(tl) {
  const byId = {};
  for (const b of tl.beats) byId[b.id] = b;
  return {
    b: id => byId[id].start,
    d: id => byId[id].dur,
    e: id => byId[id].end,
    // start of the n-th line inside a beat
    l: (id, n) => tl.lines[byId[id].lines[n]].start,
    ld: (id, n) => tl.lines[byId[id].lines[n]].dur,
    le: (id, n) => tl.lines[byId[id].lines[n]].end,
  };
}

// ----------------------------------------------------------------- score data
const CH = {
  C:  { bass: 36, triad: [48, 52, 55] },
  G:  { bass: 43, triad: [47, 50, 55] },
  Am: { bass: 45, triad: [48, 52, 57] },
  F:  { bass: 41, triad: [48, 53, 57] },
  Dm: { bass: 38, triad: [50, 53, 57] },
  Em: { bass: 40, triad: [52, 55, 59] },
};

// melodic phrases: {b: quarter-note offset, n: midi, d: length in quarters}
const PHRASES = {
  motifA: [
    { b: 0, n: 79, d: 1 }, { b: 1, n: 76, d: 1 }, { b: 2, n: 81, d: 2 },
    { b: 5, n: 79, d: 1 }, { b: 6, n: 72, d: 2 },
  ],
  motifA2: [
    { b: 0, n: 79, d: 1 }, { b: 1, n: 76, d: 1 }, { b: 2, n: 81, d: 2 },
    { b: 4, n: 77, d: 1 }, { b: 5, n: 79, d: 1 }, { b: 6, n: 76, d: 2 },
    { b: 8, n: 72, d: 1 }, { b: 9, n: 76, d: 1 }, { b: 10, n: 79, d: 2 },
    { b: 12, n: 77, d: 1 }, { b: 13, n: 76, d: 1 }, { b: 14, n: 74, d: 2 },
  ],
  quest: [
    { b: 0, n: 76, d: 1.5 }, { b: 1.5, n: 77, d: 0.5 }, { b: 2, n: 76, d: 2 },
    { b: 5, n: 72, d: 1 }, { b: 6, n: 71, d: 2 },
  ],
  flow: [
    { b: 0, n: 72, d: .5 }, { b: .5, n: 74, d: .5 }, { b: 1, n: 76, d: .5 }, { b: 1.5, n: 79, d: .5 },
    { b: 2, n: 81, d: .5 }, { b: 2.5, n: 79, d: .5 }, { b: 3, n: 76, d: .5 }, { b: 3.5, n: 74, d: .5 },
    { b: 4, n: 72, d: .5 }, { b: 4.5, n: 76, d: .5 }, { b: 5, n: 79, d: .5 }, { b: 5.5, n: 81, d: .5 },
    { b: 6, n: 83, d: .5 }, { b: 6.5, n: 81, d: .5 }, { b: 7, n: 79, d: 1 },
    { b: 8, n: 76, d: .5 }, { b: 8.5, n: 79, d: .5 }, { b: 9, n: 81, d: .5 }, { b: 9.5, n: 84, d: .5 },
    { b: 10, n: 83, d: 1 }, { b: 11, n: 79, d: 1 },
    { b: 12, n: 77, d: .5 }, { b: 12.5, n: 79, d: .5 }, { b: 13, n: 81, d: 2 },
  ],
  motifB: [
    { b: 0, n: 84, d: .5 }, { b: .5, n: 83, d: .5 }, { b: 1, n: 81, d: .5 }, { b: 1.5, n: 79, d: .5 },
    { b: 2, n: 77, d: 1 }, { b: 3, n: 76, d: 1 }, { b: 4, n: 74, d: 2 }, { b: 6, n: 72, d: 2 },
  ],
  lift: [
    { b: 0, n: 77, d: 1 }, { b: 1, n: 79, d: 1 }, { b: 2, n: 81, d: 2 },
    { b: 4, n: 79, d: 1 }, { b: 5, n: 83, d: 1 }, { b: 6, n: 84, d: 2 },
    { b: 8, n: 81, d: 1 }, { b: 9, n: 79, d: 1 }, { b: 10, n: 84, d: 4 },
  ],
  end: [{ b: 0, n: 79, d: 1 }, { b: 1, n: 84, d: 3 }],
};

const SECTIONS = {
  hook:    { chords: ['C', 'C'], lead: 'motifA', pluck: 0, marimba: 0, bass: 0.5, shaker: 0, glockHit: true, gain: 0.95 },
  brain:   { chords: ['C', 'G', 'Am', 'F'], lead: 'motifA2', pluck: 1, marimba: 0, bass: 1, shaker: 0.45, gain: 1 },
  hand:    { chords: ['C', 'Am', 'F', 'G'], lead: null, pluck: 0.6, marimba: 1, bass: 1, shaker: 0.9, gain: 1 },
  problem: { chords: ['Am', 'Dm'], lead: 'quest', pluck: 0, marimba: 0, bass: 0.45, shaker: 0, pad: true, gain: 0.95 },
  lines:   { chords: ['Am', 'F', 'C', 'G'], lead: 'flow', pluck: 1, marimba: 1.15, sixteenths: true, bass: 1, shaker: 1, gain: 1.05 },
  slim:    { chords: ['C', 'G', 'Am', 'F'], lead: 'motifB', pluck: 0.8, marimba: 0.6, bass: 1, shaker: 0.75, gain: 1 },
  capture: { chords: ['Dm', 'G', 'C', 'Am'], lead: null, pluck: 0.45, marimba: 1, bass: 1.15, shaker: 1, march: true, gain: 1 },
  release: { chords: ['F', 'G', 'C', 'C'], lead: 'lift', pluck: 1.15, marimba: 0.45, bass: 1, shaker: 0.65, glockHit: true, gain: 1.05 },
  sense:   { chords: ['C', 'C'], lead: null, pluck: 0.35, marimba: 1.35, sixteenths: true, bass: 0.75, shaker: 1, runs: true, gain: 1 },
  outro:   { chords: ['C', 'C'], lead: 'end', pluck: 0, marimba: 0, bass: 1, shaker: 0, glockHit: true, final: true, gain: 1.1 },
};

// ----------------------------------------------------------------- score render
function renderScore(tl, rng) {
  const bus = new Bus(tl.total + 1);
  const sectionAt = t => {
    for (const b of tl.beats) if (t >= b.start - 0.001 && t < b.end) return b;
    return tl.beats[tl.beats.length - 1];
  };
  const jit = () => (rng() - 0.5) * 0.016;
  const vel = (v) => v * (0.88 + rng() * 0.24);
  const swing = 0.012;

  const nBars = Math.ceil(tl.total / BAR);
  // melodic phrases advance with their own cursor per section so they are not re-triggered each bar
  const leadCursor = {};

  for (let bar = 0; bar < nBars; bar++) {
    const t0 = bar * BAR;
    const beat = sectionAt(t0);
    const sec = SECTIONS[beat.id];
    if (!sec) continue;
    const barInSection = Math.floor((t0 - beat.start) / BAR);
    const chordName = sec.chords[((barInSection % sec.chords.length) + sec.chords.length) % sec.chords.length];
    const ch = CH[chordName];
    const g = sec.gain;

    // ---- bass (pizzicato)
    if (sec.bass) {
      const pattern = sec.march ? [0, 2] : (barInSection % 2 === 0 ? [0, 2.5] : [0, 3]);
      for (const bq of pattern) {
        const t = t0 + bq * SPB + jit();
        bus.add(S.pizz(ch.bass, 0.62, rng), t, vel(0.3) * sec.bass * g, -0.08);
      }
      if (sec.final && barInSection === 0) bus.add(S.pizz(ch.bass - 12, 1.6, rng), t0 + jit(), 0.3 * g, 0);
    }

    // ---- plucked arpeggio (Karplus-Strong)
    if (sec.pluck) {
      const tones = [ch.triad[0], ch.triad[1], ch.triad[2], ch.triad[0] + 12, ch.triad[1], ch.triad[2], ch.triad[1] + 12, ch.triad[2]];
      for (let k = 0; k < 8; k++) {
        if (k % 2 === 1 && rng() < 0.18) continue;         // breathe
        const t = t0 + k * 0.5 * SPB + (k % 2 ? swing : 0) + jit();
        bus.add(S.pluck(tones[k], 1.05, rng), t, vel(0.17) * sec.pluck * g, (k % 2 ? 0.22 : -0.18));
      }
    }

    // ---- marimba ostinato (the gantry's mechanical pulse)
    if (sec.marimba) {
      const steps = sec.sixteenths ? 16 : 8;
      const tones = sec.sixteenths
        ? [ch.triad[0] + 12, ch.triad[1] + 12, ch.triad[2] + 12, ch.triad[1] + 12]
        : [ch.triad[0] + 12, ch.triad[2] + 12, ch.triad[1] + 12, ch.triad[2] + 12];
      for (let k = 0; k < steps; k++) {
        if (sec.sixteenths && k % 4 === 2 && rng() < 0.3) continue;
        const t = t0 + k * (4 / steps) * SPB + jit() * 0.6;
        const accent = k % (steps / 4) === 0 ? 1 : 0.62;
        bus.add(S.marimba(tones[k % tones.length], 0.5, rng),
          t, vel(0.11) * accent * sec.marimba * g, ((k % 4) - 1.5) * 0.09);
      }
    }

    // ---- shaker
    if (sec.shaker) {
      const acc = [1, .42, .66, .42, .88, .42, .66, .5];
      for (let k = 0; k < 8; k++) {
        if (sec.march && k % 2 === 0) continue;
        const t = t0 + k * 0.5 * SPB + (k % 2 ? swing : 0) + jit() * 0.8;
        bus.add(S.shaker(0.07, rng, 1), t, vel(0.062) * acc[k] * sec.shaker * g, (k % 2 ? 0.3 : -0.3));
      }
    }

    // ---- sustained pad for the tension beat
    if (sec.pad && barInSection === 0) {
      const len = Math.min(beat.dur, 4.4);
      for (const n of ch.triad) bus.add(S.pad(n, len, rng, 0.9), t0, 0.5 * g, (rng() - 0.5) * 0.5);
      bus.add(S.pad(ch.bass, len, rng, 0.8), t0, 0.42 * g, 0);
    }

    // ---- ascending 16th runs: "64 sensors waking up"
    if (sec.runs) {
      const sc = [72, 74, 76, 79, 81, 83, 84, 86];
      for (let k = 0; k < 8; k++) {
        const t = t0 + (barInSection % 2 ? 2 : 0) * SPB + k * 0.25 * SPB + jit() * 0.4;
        bus.add(S.marimba(sc[k], 0.34, rng), t, vel(0.085) * g, -0.4 + k * 0.1);
      }
    }

    // ---- lead (music box)
    if (sec.lead) {
      const ph = PHRASES[sec.lead];
      const phraseBars = Math.ceil(Math.max(...ph.map(x => x.b + x.d)) / 4);
      if (leadCursor[beat.id] === undefined) leadCursor[beat.id] = 0;
      const cur = leadCursor[beat.id];
      if (barInSection % phraseBars === 0 || cur === 0) {
        // emit the whole phrase once at this bar, as long as it fits the section
        if (t0 + phraseBars * BAR <= beat.end + 1.2 && (barInSection % phraseBars === 0)) {
          for (const nt of ph) {
            const t = t0 + nt.b * SPB + jit();
            if (t > tl.total) continue;
            bus.add(S.musicBox(nt.n, Math.min(nt.d * SPB + 1.3, 2.6), rng),
              t, vel(0.2) * g, (rng() - 0.5) * 0.3);
          }
          leadCursor[beat.id] = cur + 1;
        }
      }
    }

    // ---- glockenspiel sparkle on section entry
    if (sec.glockHit && barInSection === 0) {
      bus.add(S.glock(96, 2.4, rng), t0 + jit(), 0.12 * g, 0.3);
      bus.add(S.glock(88, 2.0, rng), t0 + 0.06, 0.09 * g, -0.3);
    }
    if (sec.final && barInSection === 0) {
      for (const n of [84, 88, 91, 96]) bus.add(S.glock(n, 3.0, rng), t0 + 0.02 * (n % 7), 0.1, (n % 5 - 2) * 0.15);
      bus.add(S.thump(0.5, rng, 140, 48, 0.5), t0, 0.5, 0);
    }
  }
  return bus;
}

// ----------------------------------------------------------------- foley
function renderFoley(tl, rng) {
  const bus = new Bus(tl.total + 1);
  const T = mk(tl);
  const cues = [];
  const put = (t, buf, gain, pan) => { if (t < tl.total + 0.5) { bus.add(buf, t, gain, pan || 0); } };
  const cue = (t, kind) => cues.push({ t: +t.toFixed(3), kind });

  // ---------- hook: paper collage assembles, pawn slides by itself
  {
    const B = T.b('hook'), D = T.d('hook');
    put(B + 0.00, S.paper(0.5, rng, 0.85), 1, 0);             cue(B, 'tear');
    [0.16, 0.30, 0.44, 0.60, 0.76].forEach((dt, k) => {
      put(B + dt, S.paper(0.2, rng, 0.5), 1, (k % 3 - 1) * 0.35); cue(B + dt, 'paper');
    });
    const ts = B + 0.46 * D;
    put(ts - 0.05, S.magnetSnap(rng, 0.42), 1, -0.1);          cue(ts - 0.05, 'snap');
    put(ts, S.motorRun(0.62, rng, 0.2), 1, 0);
    put(ts + 0.04, S.slide(0.5, rng, 0.42), 1, 0.1);           cue(ts, 'slide');
    put(ts + 0.52, S.pop(rng, 0.3), 1, 0.15);                  cue(ts + 0.52, 'land');
    put(B + 0.81 * D, S.stamp(rng, 0.5), 1, -0.25);            cue(B + 0.81 * D, 'stamp');
  }

  // ---------- brain: you on top, machine below, move tree explodes
  {
    put(T.l('brain', 0) + 0.04, S.pop(rng, 0.34), 1, -0.3);
    put(T.l('brain', 0) + 0.10, S.paper(0.26, rng, 0.45), 1, -0.3);
    put(T.l('brain', 1) + 0.05, S.paper(0.3, rng, 0.5), 1, 0.3);
    put(T.l('brain', 1) + 0.22, S.pop(rng, 0.3), 1, 0.35);
    const L2 = T.l('brain', 2), L2d = T.ld('brain', 2);
    for (let k = 0; k < 13; k++) {
      const u = k / 12;
      put(L2 + 0.12 + u * (L2d * 0.62), S.blip(rng, 0.1, 620 + u * 1250, 760 + u * 1500, 0.045), 1, (u - 0.5) * 0.8);
    }
    put(L2 + L2d * 0.74, S.pencil(0.34, rng, 0.42), 1, 0.1);
    put(L2 + L2d * 0.80, S.blip(rng, 0.26, 1180, 1620, 0.1), 1, 0);
  }

  // ---------- hand: cutaway, the magnet rides the belt
  {
    const B = T.b('hand');
    put(B + 0.00, S.paper(0.42, rng, 0.7), 1, 0);              cue(B, 'tear');
    put(T.l('hand', 0) + 0.08, S.pop(rng, 0.32), 1, 0.2);
    put(T.l('hand', 0) + 0.28, S.switchClick(rng, 0.42), 1, 0.1); cue(T.l('hand', 0) + 0.28, 'switch');
    put(T.l('hand', 0) + 0.34, S.magnetSnap(rng, 0.5), 1, 0);  cue(T.l('hand', 0) + 0.34, 'snap');
    /* the coil sings for the rest of the beat - so its silence lands later */
    put(T.l('hand', 0) + 0.36, S.coilHum(T.e('hand') - (T.l('hand', 0) + 0.36) - 0.1, rng, 0.14, 0.25), 1, 0.06);
    const L1 = T.l('hand', 1);
    put(L1 + 0.30, S.motorRun(1.45, rng, 0.3), 1, -0.15);      cue(L1 + 0.30, 'motor');
    [0.85, 1.35, 1.85].forEach((dt, k) => put(L1 + dt, S.pencil(0.26, rng, 0.34), 1, (k - 1) * 0.3));
    put(L1 + 1.72, S.magnetSnap(rng, 0.34), 1, 0.1);
  }

  // ---------- problem: head-on collision
  {
    const B = T.b('problem'), D = T.d('problem');
    put(B + 0.18 * D, S.slide(0.42, rng, 0.4), 1, -0.1);       cue(B + 0.18 * D, 'slide');
    const hit = B + 0.46 * D;
    put(hit, S.woodKnock(0.16, rng, 300, 0.75), 1, 0);         cue(hit, 'bonk');
    put(hit + 0.13, S.woodKnock(0.1, rng, 420, 0.3), 1, 0.2);
    put(hit + 0.25, S.woodKnock(0.08, rng, 520, 0.18), 1, -0.2);
    put(B + 0.62 * D, S.pencil(0.3, rng, 0.5), 1, 0);          cue(B + 0.62 * D, 'cross');
  }

  // ---------- lines: the lattice, then the knight threads the gap
  {
    put(T.l('lines', 0) + 0.22, S.pencil(0.5, rng, 0.4), 1, -0.3);
    put(T.l('lines', 0) + 0.52, S.pencil(0.5, rng, 0.4), 1, 0.3);
    const L1 = T.l('lines', 1);
    put(L1 + 0.16, S.magnetSnap(rng, 0.42), 1, -0.15);         cue(L1 + 0.16, 'snap');
    put(L1 + 0.26, S.motorRun(1.75, rng, 0.3), 1, 0);          cue(L1 + 0.26, 'motor');
    put(L1 + 0.30, S.slide(0.95, rng, 0.34), 1, 0);            cue(L1 + 0.30, 'slide');
    put(L1 + 2.01, S.blip(rng, 0.2, 980, 1340, 0.08), 1, 0.1);
    const L2 = T.l('lines', 2);
    put(L2 + 0.26, S.pencil(0.24, rng, 0.38), 1, -0.4);
    put(L2 + 0.52, S.pencil(0.24, rng, 0.38), 1, 0.4);
    put(L2 + 1.00, S.blip(rng, 0.17, 1320, 1320, 0.07), 1, 0);
  }

  // ---------- slim: the line-up, the rule, the fat pawn
  {
    const L0 = T.l('slim', 0);
    for (let k = 0; k < 6; k++) put(L0 + 0.05 + k * 0.11, S.pop(rng, 0.2), 1, -0.45 + k * 0.18);
    [0.95, 1.4, 1.8].forEach((dt, k) => put(L0 + dt, S.pencil(0.3, rng, 0.42), 1, (k - 1) * 0.25));
    const L1 = T.l('slim', 1), L1d = T.ld('slim', 1);
    const jam = L1 + L1d * 0.46;
    put(L1 + 0.08, S.slide(Math.max(0.3, L1d * 0.42), rng, 0.36), 1, -0.1);
    put(jam, S.woodKnock(0.14, rng, 260, 0.6), 1, 0);          cue(jam, 'bonk');
    put(jam + 0.2, S.blip(rng, 0.16, 760, 300, 0.2), 1, 0.15);
    put(L1 + L1d * 0.76, S.pop(rng, 0.3), 1, -0.15);
  }

  // ---------- capture: escort the loser, then move in
  {
    const L0 = T.l('capture', 0);
    put(L0 + 0.12, S.magnetSnap(rng, 0.42), 1, -0.2);
    put(L0 + 0.18, S.motorRun(1.3, rng, 0.28), 1, -0.1);       cue(L0 + 0.18, 'motor');
    put(L0 + 0.22, S.slide(0.8, rng, 0.36), 1, 0.1);           cue(L0 + 0.22, 'slide');
    put(L0 + 1.55, S.blip(rng, 0.22, 700, 980, 0.09), 1, 0.4);
    put(L0 + 1.62, S.woodKnock(0.09, rng, 640, 0.3), 1, 0.4);  cue(L0 + 1.62, 'park');
    const L1 = T.l('capture', 1);
    put(L1 + 0.08, S.pencil(0.26, rng, 0.38), 1, -0.3);
    put(L1 + 0.46, S.magnetSnap(rng, 0.38), 1, 0);
    put(L1 + 0.52, S.motorRun(0.95, rng, 0.26), 1, 0);
    put(L1 + 0.56, S.slide(0.62, rng, 0.34), 1, 0);            cue(L1 + 0.56, 'slide');
    put(L1 + 1.45, S.pop(rng, 0.3), 1, 0.1);
    put(L1 + 1.34, S.pencil(0.24, rng, 0.36), 1, 0.3);
  }

  // ---------- release: the current is switched off and the field is simply gone
  {
    const L0 = T.l('release', 0), L1 = T.l('release', 1), L2 = T.l('release', 2);
    const off = L1 + 0.45;                                     // the switch is thrown here
    put(L0 + 0.08, S.motorRun(0.85, rng, 0.26), 1, -0.1);
    put(L0 + 0.95, S.magnetSnap(rng, 0.3), 1, 0);
    put(L0 + 0.10, S.coilHum(Math.max(0.4, off - L0 - 0.10), rng, 0.18, 0.06), 1, 0.05);
    cue(L0 + 0.10, 'coil');
    put(off, S.switchClick(rng, 0.62), 1, 0.12);               cue(off, 'switch');
    put(off + 0.03, S.thump(0.22, rng, 150, 52, 0.22), 1, 0);  cue(off + 0.03, 'fieldoff');
    put(L2 + 0.35, S.blip(rng, 0.1, 520, 360, 0.14), 1, -0.1);
    put(L2 + 1.05, S.pop(rng, 0.26), 1, 0.1);
    put(L2 + 1.15, S.paper(0.24, rng, 0.34), 1, 0.2);
  }

  // ---------- sense: 64 little eyes
  {
    const L0 = T.l('sense', 0);
    put(L0 + 0.06, S.pop(rng, 0.3), 1, -0.25);
    put(L0 + 0.12, S.paper(0.3, rng, 0.45), 1, -0.25);
    const land = L0 + 0.1 + Math.max(0.9, T.ld('sense', 0) - 0.25) * 0.5;
    put(land - 0.06, S.blip(rng, 0.24, 900, 520, 0.09), 1, -0.3); cue(land - 0.06, 'off');
    put(land + 0.14, S.blip(rng, 0.26, 700, 1280, 0.09), 1, 0.3); cue(land + 0.14, 'on');
    const L1 = T.l('sense', 1), L1d = T.ld('sense', 1);
    for (let k = 0; k < 18; k++) {
      const u = k / 17;
      put(L1 + 0.22 + u * (L1d * 0.72), S.blip(rng, 0.075, 540 + u * 1500, 640 + u * 1700, 0.04), 1, (u - 0.5) * 0.9);
    }
    put(L1 + L1d * 0.86, S.pencil(0.36, rng, 0.42), 1, 0.3);
  }

  // ---------- outro
  {
    const B = T.b('outro'), D = T.d('outro');
    put(B + 0.00, S.paper(0.46, rng, 0.75), 1, 0);             cue(B, 'tear');
    put(B + 0.18, S.paper(0.22, rng, 0.4), 1, -0.3);
    put(B + 0.27 * D, S.stamp(rng, 0.68), 1, 0);               cue(B + 0.27 * D, 'stamp');
    put(B + 0.62 * D, S.paper(0.3, rng, 0.4), 1, 0.25);
  }

  cues.sort((a, b) => a.t - b.t);
  return { bus, cues };
}

// ----------------------------------------------------------------- narration
function renderNarration(tl, lang) {
  const bus = new Bus(tl.total + 1);
  const dir = path.join(ROOT, 'audio', lang, 'pcm');
  const TARGET_RMS = 0.085;
  for (const line of tl.lines) {
    const pcm = readF32(path.join(dir, `l${String(line.i).padStart(2, '0')}.f32`));
    // even out line-to-line level
    let sum = 0;
    for (let i = 0; i < pcm.length; i++) sum += pcm[i] * pcm[i];
    const rms = Math.sqrt(sum / Math.max(1, pcm.length));
    const g = Math.min(2.6, Math.max(0.5, TARGET_RMS / Math.max(1e-5, rms)));
    bus.add(pcm, line.start, g, 0);
  }
  // gentle voice EQ: lose the rumble, add a little presence
  bus.L = filt(bus.L, biquad('hp', 95, 0.7));
  bus.R = filt(bus.R, biquad('hp', 95, 0.7));
  bus.L = filt(bus.L, biquad('peak', 3300, 1.1, 1.8));
  bus.R = filt(bus.R, biquad('peak', 3300, 1.1, 1.8));
  bus.L = filt(bus.L, biquad('peak', 260, 1.0, -1.4));
  bus.R = filt(bus.R, biquad('peak', 260, 1.0, -1.4));
  return bus;
}

// ----------------------------------------------------------------- main
function build(lang) {
  const tl = buildTimeline(lang);
  const rng = mulberry32(0x5EED + lang.charCodeAt(0) * 977);

  const music = renderScore(tl, rng);
  reverb(music, { room: 0.74, damp: 0.33, wet: 0.2, width: 0.9 });
  music.scale(0.88);

  const { bus: foley, cues } = renderFoley(tl, rng);
  reverb(foley, { room: 0.6, damp: 0.45, wet: 0.1, width: 0.8 });

  const voice = renderNarration(tl, lang);
  reverb(voice, { room: 0.42, damp: 0.6, wet: 0.055, width: 0.5 });

  // duck music hard and foley lightly under the voice
  const duckM = duckCurve(voice.L, voice.R, { depthDb: -8.5, attack: 0.03, release: 0.38 });
  const duckF = duckCurve(voice.L, voice.R, { depthDb: -2.5, attack: 0.03, release: 0.3 });
  music.applyGain(duckM);
  foley.applyGain(duckF);

  const master = new Bus(tl.total + 1);
  master.addStereo(voice, 1.0);
  master.addStereo(music, 1.0);
  master.addStereo(foley, 1.02);

  master.fadeIn(0.06);
  master.fadeOut(tl.total - 1.5, 1.5);
  // gain staging: lift into the limiter so the mix arrives near broadcast level
  const pk = master.peak();
  master.scale(0.85 / Math.max(1e-6, pk));
  limit(master, 0.92);

  const wav = path.join(ROOT, 'cache', `master_${lang}.wav`);
  const secs = writeWav(wav, master, tl.total);

  // --- QA: level balance of the stems, inside speech vs. in the gaps
  {
    const isSpeech = new Uint8Array(Math.ceil(tl.total * SR));
    for (const l of tl.lines) {
      const a = Math.round(l.start * SR), b = Math.min(isSpeech.length, Math.round(l.end * SR));
      for (let i = a; i < b; i++) isSpeech[i] = 1;
    }
    const rms = (bus, want) => {
      let s = 0, n = 0;
      for (let i = 0; i < isSpeech.length; i++) {
        if (isSpeech[i] === want) { s += bus.L[i] * bus.L[i] + bus.R[i] * bus.R[i]; n += 2; }
      }
      return 20 * Math.log10(Math.sqrt(s / Math.max(1, n)) + 1e-9);
    };
    const v = rms(voice, 1), m = rms(music, 1), f = rms(foley, 1), mg = rms(music, 0);
    console.log(`[${lang}] QA  voice ${v.toFixed(1)} dB | music(ducked) ${m.toFixed(1)} dB `
      + `| foley ${f.toFixed(1)} dB | music in gaps ${mg.toFixed(1)} dB`
      + `  ->  voice-over-music ${(v - m).toFixed(1)} dB`);
    if (process.env.STEMS) {
      writeWav(path.join(ROOT, 'cache', `stem_voice_${lang}.wav`), voice, tl.total);
      writeWav(path.join(ROOT, 'cache', `stem_music_${lang}.wav`), music, tl.total);
      writeWav(path.join(ROOT, 'cache', `stem_foley_${lang}.wav`), foley, tl.total);
    }
  }

  tl.cues = cues;
  fs.writeFileSync(path.join(ROOT, 'cache', `timeline_${lang}.json`),
    JSON.stringify(tl, null, 1));

  console.log(`[${lang}] ${secs.toFixed(2)}s  speechEnd=${tl.speechEnd}s  peak=${master.peak().toFixed(3)}  cues=${cues.length}`);
  for (const b of tl.beats) {
    console.log(`     ${b.id.padEnd(8)} ${b.start.toFixed(2).padStart(6)} -> ${b.end.toFixed(2).padStart(6)}  (${b.dur.toFixed(2)}s)`);
  }
}

for (const lang of (process.argv.slice(2).length ? process.argv.slice(2) : ['de', 'en'])) build(lang);
