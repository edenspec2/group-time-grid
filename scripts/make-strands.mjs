const ROWS = 8;
const COLS = 6;
const TOTAL = ROWS * COLS;

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function neighbors(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const out = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push(nr * COLS + nc);
    }
  }
  return out;
}

const NBS = Array.from({ length: TOTAL }, (_, i) => neighbors(i));

function components(free) {
  const leftover = new Set(free);
  const sizes = [];
  const groups = [];
  while (leftover.size) {
    const start = leftover.values().next().value;
    const stack = [start];
    leftover.delete(start);
    const group = [start];
    while (stack.length) {
      const cell = stack.pop();
      for (const next of NBS[cell]) {
        if (!leftover.has(next)) continue;
        leftover.delete(next);
        stack.push(next);
        group.push(next);
      }
    }
    sizes.push(group.length);
    groups.push(group);
  }
  return { sizes, groups };
}

function subsetSums(lengths) {
  const sums = new Set([0]);
  for (const len of lengths) {
    for (const sum of [...sums]) sums.add(sum + len);
  }
  return sums;
}

function remainingOk(used, remainingLengths) {
  const free = [];
  for (let i = 0; i < TOTAL; i += 1) if (!used.has(i)) free.push(i);
  if (free.length !== remainingLengths.reduce((a, b) => a + b, 0)) return false;
  if (!remainingLengths.length) return true;
  const { sizes } = components(free);
  const sums = subsetSums(remainingLengths);
  const min = Math.min(...remainingLengths);
  return sizes.every((size) => size >= min && sums.has(size));
}

function compactness(path, candidate) {
  return NBS[candidate].reduce((n, cell) => n + (path.includes(cell) ? 1 : 0), 0);
}

function placeWords(words, rng, budget = 12000) {
  const ordered = [...words].sort((a, b) => b.length - a.length);
  const used = new Set();
  const paths = {};
  let nodes = 0;

  function search(wordIndex, path) {
    nodes += 1;
    if (nodes > budget) return false;
    if (wordIndex === ordered.length) return used.size === TOTAL;
    const word = ordered[wordIndex];
    const leftover = ordered.slice(wordIndex + 1).map((item) => item.length);

    if (path.length === word.length) {
      path.forEach((cell) => used.add(cell));
      paths[word] = [...path];
      const ok = remainingOk(used, leftover) && search(wordIndex + 1, []);
      if (ok) return true;
      path.forEach((cell) => used.delete(cell));
      delete paths[word];
      return false;
    }

    let candidates;
    if (!path.length) {
      candidates = shuffle([...Array(TOTAL).keys()].filter((cell) => !used.has(cell)), rng);
    } else {
      candidates = NBS[path[path.length - 1]].filter((cell) => !used.has(cell) && !path.includes(cell));
      candidates.sort((a, b) => compactness(path, b) - compactness(path, a) || rng() - 0.5);
    }

    for (const cell of candidates) {
      const next = [...path, cell];
      if (next.length < word.length && !NBS[cell].some((n) => !used.has(n) && !next.includes(n))) continue;
      if (search(wordIndex, next)) return true;
    }
    return false;
  }

  return search(0, []) ? paths : null;
}

function hamiltonian(rng) {
  function walk(path) {
    if (path.length === TOTAL) return path;
    const used = new Set(path);
    const options = NBS[path[path.length - 1]]
      .filter((cell) => !used.has(cell))
      .sort((a, b) => {
        const ca = NBS[a].filter((cell) => !used.has(cell)).length;
        const cb = NBS[b].filter((cell) => !used.has(cell)).length;
        return ca - cb || rng() - 0.5;
      });
    for (const cell of options) {
      const found = walk([...path, cell]);
      if (found) return found;
    }
    return null;
  }
  for (const start of shuffle([...Array(TOTAL).keys()], rng)) {
    const path = walk([start]);
    if (path) return path;
  }
  return null;
}

function placeBySnake(words, rng) {
  const path = hamiltonian(rng);
  if (!path) return null;
  const ordered = shuffle(words, rng);
  const paths = {};
  let cursor = 0;
  for (const word of ordered) {
    let slice = path.slice(cursor, cursor + word.length);
    if (rng() < 0.5) slice = slice.reverse();
    paths[word] = slice;
    cursor += word.length;
  }
  return paths;
}

function pathsToGrid(paths) {
  const letters = Array(TOTAL).fill("");
  for (const [word, path] of Object.entries(paths)) {
    path.forEach((cell, i) => {
      letters[cell] = word[i];
    });
  }
  const grid = [];
  for (let row = 0; row < ROWS; row += 1) {
    grid.push(letters.slice(row * COLS, (row + 1) * COLS).join(""));
  }
  return grid;
}

const SPECS = [
  { id: "carbonyls", theme: "Carbonyls on the bench", spanagram: "CARBONYL", words: ["ALDEHYDE", "KETONE", "ESTER", "AMIDE", "LACTONE", "IMIDE", "ACID"] },
  { id: "halogens", theme: "The halogen family", spanagram: "HALOGENS", words: ["FLUORINE", "CHLORINE", "BROMINE", "IODINE", "HALIDE", "ATOMS"] },
  { id: "solvents", theme: "What the reaction is dissolved in", spanagram: "SOLVENTS", words: ["HEXANE", "TOLUENE", "ACETONE", "METHANOL", "ETHER", "DIOXANE"] },
  { id: "aromatics", theme: "Rings with a 4n+2 story", spanagram: "AROMATIC", words: ["BENZENE", "PHENOL", "ANILINE", "FURAN", "PYRROLE", "PYRIDINE"] },
  { id: "labgear", theme: "Stuff on the bench", spanagram: "GLASSWARE", words: ["VIAL", "CLAMP", "SEPTUM", "SYRINGE", "BEAKER", "FUNNEL", "FLASK"] },
  { id: "alkenes", theme: "Unsaturated carbons", spanagram: "ALKENES", words: ["ETHENE", "STYRENE", "DIENE", "ALKYNE", "ALLENE", "VINYL", "OLEFIN"] },
  { id: "spectra", theme: "How we see molecules", spanagram: "SPECTRA", words: ["MASS", "INFRARED", "PROTON", "SHIFT", "PEAKS", "NOESY", "COSY", "HMBC"] },
];

const puzzles = [];
for (const spec of SPECS) {
  const all = [spec.spanagram, ...spec.words];
  const letters = all.join("").length;
  if (letters !== TOTAL) throw new Error(`${spec.id} length ${letters}`);
  let paths = null;
  for (let attempt = 0; attempt < 80 && !paths; attempt += 1) {
    const rng = mulberry32((spec.id.charCodeAt(0) * 1000 + attempt * 997) >>> 0);
    paths = placeWords(all, rng);
  }
  if (!paths) {
    for (let attempt = 0; attempt < 20 && !paths; attempt += 1) {
      const rng = mulberry32((spec.id.charCodeAt(0) * 4243 + attempt * 131) >>> 0);
      paths = placeBySnake(all, rng);
    }
  }
  if (!paths) throw new Error(`failed ${spec.id}`);
  const grid = pathsToGrid(paths);
  const used = new Set(Object.values(paths).flat());
  if (used.size !== TOTAL) throw new Error(`${spec.id} coverage`);
  puzzles.push({
    ...spec,
    grid,
    paths: Object.fromEntries(all.map((word) => [word, paths[word]])),
  });
  console.error(`ok ${spec.id}`);
}

import fs from "node:fs";
fs.writeFileSync(new URL("./strands-out.json", import.meta.url), `${JSON.stringify(puzzles)}\n`);
