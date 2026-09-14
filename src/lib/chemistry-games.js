export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueWords(words, letters) {
  return [...new Set(words.map((word) => word.toUpperCase()))].filter((word) => word.length === letters);
}

export const WORDLE_PACKS = [
  {
    id: "starter",
    label: "Starter",
    letters: 4,
    blurb: "Short lab words",
    words: uniqueWords([
      "ACID", "BASE", "SALT", "BOND", "RING", "ATOM", "IONS", "GOLD", "IRON", "LEAD",
      "ZINC", "NEON", "UREA", "DIOL", "ENOL", "ACYL", "ARYL", "VIAL", "HOOD", "FLUX",
      "SOAP", "PEAK", "SCAN", "HEAT", "STIR", "MOLE", "TUBE", "GELS", "NACL", "HPLC",
      "GCMS", "LCMS", "AIBN", "HMPA", "HATU", "DMAP", "HOBT", "TFAA", "BEAD", "LOCK",
      "SHIM", "DYES", "IONS",
    ], 4),
  },
  {
    id: "classic",
    label: "Classic",
    letters: 5,
    blurb: "Functional groups",
    words: uniqueWords([
      "AMIDE", "ESTER", "AMINO", "NITRO", "ALKYL", "VINYL", "ALLYL", "DIENE",
      "ENONE", "EPOXY", "IMINE", "IMIDE", "AZIDE", "OXIDE", "YLIDE", "ARENE",
      "FURAN", "THIOL", "ORTHO", "TRANS", "POLAR", "LEWIS", "IONIC", "BORON",
      "ETHER", "ENOLS", "ENYNE", "OXIME", "KETAL", "CYANO", "ETHYL", "BUTYL",
      "HEXYL", "OCTYL", "ANION", "ARYLS", "PYRAN", "AZOLE", "SULFO", "ENALS",
      "ACYLS", "DIOLS", "ALLEN", "YNONE", "KETEN", "CUMYL", "SILYL", "XYLYL",
      "TOLYL", "BROMO", "AMINE",
    ], 5),
  },
  {
    id: "lab",
    label: "Lab bench",
    letters: 5,
    blurb: "Reagents and spectra",
    words: uniqueWords([
      "TEMPO", "DABCO", "TOSYL", "MESYL", "BINAP", "PYBOX", "PROBE", "FLASH",
      "LASER", "YIELD", "RATES", "SPLIT", "STACK", "CROWN", "CRYPT", "HOSTS",
      "GUEST", "CAGES", "SHIFT", "DELTA", "PEAKS", "SOLVE", "REDOX", "METAL",
      "MOLAR", "MOLAL", "SYNTH", "TITAN", "KRYPT", "FERRO", "TRIFL", "ARGON",
      "XENON", "RADON", "OZONE", "NEONS", "HELIO",
    ], 5),
  },
  {
    id: "challenge",
    label: "Challenge",
    letters: 6,
    blurb: "Physical organic",
    words: uniqueWords([
      "ALKENE", "ALKYNE", "ALKANE", "KETONE", "PHENOL", "BENZYL", "PHENYL", "METHYL",
      "PROPYL", "PENTYL", "CHIRAL", "STEREO", "BORANE", "SILANE", "SODIUM", "CARBON",
      "OXYGEN", "HELIUM", "NICKEL", "COBALT", "COPPER", "FLUORO", "CHLORO", "LACTAM",
      "YLIDES", "AMIDES", "ESTERS", "AMINES", "AZIDES", "OXIDES", "THIOLS", "ENONES",
      "DIENES", "ALKYLS", "VINYLS", "ALLYLS", "ACETAL", "KETALS", "OXIMES", "IMINES",
      "IMIDES", "ALLENE", "BIARYL", "ENYNES", "DIYNES", "KETENE", "ENOATE", "XYLENE",
      "CRESOL", "ARENES", "FURANS", "INDOLE", "LITHIO", "NITROS", "ETHYNE",
      "KETENE", "HALIDE", "CYANOS",
    ], 6),
  },
  {
    id: "named",
    label: "Seven",
    letters: 7,
    blurb: "Longer lab words",
    words: uniqueWords([
      "BENZENE", "ANILINE", "TOLUENE", "STYRENE", "PYRROLE", "ENOLATE", "NITRILE",
      "BROMIDE", "HALIDES", "ALKYNES", "ALKENES", "ALKANES", "PHENOLS", "STERICS",
      "KINETIC", "ACIDITY", "BORANES", "SILANES", "LACTONE", "EPOXIDE", "INDOLES",
      "ACETONE", "ETHANOL", "METHANE", "BENZYNE", "CARBENE", "NITRENE", "RADICAL",
      "ENAMINE", "OXAZOLE", "NITROSO", "SULFONE", "SULFIDE", "ACETALS", "PINACOL",
      "GLYCOLS", "CYANATE", "ETHYNYL", "PROPENE", "PENTYNE", "HEPTANE", "FERROUS",
    ], 7),
  },
];

export const WORDLE_HINTS = {
  ACID: "Opposite of a base",
  BASE: "Takes a proton",
  ENOL: "The tautomer of a ketone",
  AMIDE: "Carbonyl bound to nitrogen",
  ESTER: "Carbonyl bound to OR",
  VINYL: "The H2C=CH– group",
  ALLYL: "The H2C=CH–CH2– group",
  ORTHO: "1,2 on a benzene ring",
  TRANS: "Opposite faces of a double bond",
  TEMPO: "A persistent nitroxyl radical",
  DABCO: "A nucleophilic tertiary amine base",
  TOSYL: "The p-toluenesulfonyl group",
  BINAP: "A chiral bisphosphine ligand",
  ALKENE: "C=C, two parallel lines",
  ALKYNE: "C≡C, three parallel lines",
  PHENOL: "OH on an aromatic ring",
  CHIRAL: "Not superimposable on its mirror image",
  STEREO: "About 3D arrangement",
  BENZENE: "C6H6, the parent arene",
  ENOLATE: "The conjugate base of a carbonyl",
  NITRILE: "A carbon–nitrogen triple bond",
  CARBENE: "A divalent carbon intermediate",
};

export function dailyIndex(length, salt = "") {
  const day = new Date().toISOString().slice(0, 10) + salt;
  let hash = 2166136261;
  for (let i = 0; i < day.length; i += 1) hash = Math.imul(hash ^ day.charCodeAt(i), 16777619);
  return Math.abs(hash) % length;
}

export function pickWordleAnswer(pack, daily) {
  if (daily) return pack.words[dailyIndex(pack.words.length, pack.id)];
  return shuffle(pack.words)[0];
}

export function scoreWordleGuess(guess, answer) {
  const guessed = guess.toUpperCase().split("");
  const target = answer.toUpperCase().split("");
  const result = Array(target.length).fill("absent");
  const leftover = {};
  for (let i = 0; i < target.length; i += 1) {
    if (guessed[i] === target[i]) result[i] = "correct";
    else leftover[target[i]] = (leftover[target[i]] || 0) + 1;
  }
  for (let i = 0; i < guessed.length; i += 1) {
    if (result[i] === "correct") continue;
    if (leftover[guessed[i]]) {
      result[i] = "present";
      leftover[guessed[i]] -= 1;
    }
  }
  return result;
}

export function hardModeError(word, rows) {
  const greens = Array(word.length).fill("");
  const required = {};
  for (const row of rows) {
    row.letters.forEach((letter, i) => {
      if (row.tones[i] === "correct") greens[i] = letter;
      if (row.tones[i] === "present" || row.tones[i] === "correct") required[letter] = true;
    });
  }
  for (let i = 0; i < word.length; i += 1) {
    if (greens[i] && word[i] !== greens[i]) return `Hard mode: keep ${greens[i]} in slot ${i + 1}.`;
  }
  for (const letter of Object.keys(required)) {
    if (!word.includes(letter)) return `Hard mode: reuse ${letter}.`;
  }
  return "";
}

const TONE_EMOJI = { correct: "🟩", present: "🟨", absent: "⬛" };
const GROUP_EMOJI = { yellow: "🟨", green: "🟩", blue: "🟦", purple: "🟪" };

export function wordleShare(rows, won, maxGuesses = 6) {
  const score = won ? String(rows.length) : "X";
  const grid = rows.map((row) => row.tones.map((tone) => TONE_EMOJI[tone]).join("")).join("\n");
  return `Chemle ${score}/${maxGuesses}\n${grid}`;
}

export function connectionsShare(solved) {
  return `Lab Connections\n${solved.map((group) => GROUP_EMOJI[group.color].repeat(4)).join("\n")}`;
}

export const CONNECTION_THEMES = [
  { id: "any", label: "Surprise me" },
  { id: "lab", label: "Lab bench" },
  { id: "mechanisms", label: "Mechanisms" },
  { id: "elements", label: "Elements" },
  { id: "spectra", label: "Spectra" },
  { id: "named", label: "Named reactions" },
  { id: "solvents", label: "Solvents" },
];

export const CONNECTION_PUZZLES = [
  {
    id: "poc-1",
    theme: "mechanisms",
    groups: [
      { name: "Polar aprotic solvents", color: "yellow", items: ["DMSO", "DMF", "Acetone", "MeCN"] },
      { name: "Carbonyl families", color: "green", items: ["Ketone", "Aldehyde", "Ester", "Amide"] },
      { name: "Leaving groups", color: "blue", items: ["OTs", "OTf", "Br−", "I−"] },
      { name: "Pericyclic reactions", color: "purple", items: ["Diels–Alder", "Cope", "Claisen", "Electrocyclic"] },
    ],
  },
  {
    id: "poc-2",
    theme: "lab",
    groups: [
      { name: "Halogens", color: "yellow", items: ["Fluorine", "Chlorine", "Bromine", "Iodine"] },
      { name: "Strong bases", color: "green", items: ["LDA", "NaH", "t-BuOK", "n-BuLi"] },
      { name: "Protecting groups", color: "blue", items: ["TBS", "Bn", "Boc", "Cbz"] },
      { name: "Pd-catalyzed couplings", color: "purple", items: ["Suzuki", "Heck", "Stille", "Negishi"] },
    ],
  },
  {
    id: "poc-3",
    theme: "spectra",
    groups: [
      { name: "Common NMR nuclei", color: "yellow", items: ["¹H", "¹³C", "¹⁹F", "³¹P"] },
      { name: "Oxidants", color: "green", items: ["PCC", "DMP", "Swern", "KMnO₄"] },
      { name: "Reductants", color: "blue", items: ["LiAlH₄", "NaBH₄", "DIBAL", "H₂/Pd"] },
      { name: "Unusually acidic C–H", color: "purple", items: ["Cyclopentadiene", "Fluorene", "Terminal alkyne", "Nitromethane"] },
    ],
  },
  {
    id: "poc-4",
    theme: "mechanisms",
    groups: [
      { name: "Stereodescriptors", color: "yellow", items: ["R", "S", "E", "Z"] },
      { name: "o/p directors in EAS", color: "green", items: ["OMe", "NH₂", "Me", "OH"] },
      { name: "Meta directors in EAS", color: "blue", items: ["NO₂", "CN", "CF₃", "CHO"] },
      { name: "Named carbonyl reactions", color: "purple", items: ["Wittig", "Grignard", "Aldol", "Wolff–Kishner"] },
    ],
  },
  {
    id: "poc-5",
    theme: "elements",
    groups: [
      { name: "Noble gases", color: "yellow", items: ["He", "Ne", "Ar", "Kr"] },
      { name: "Alkali metals", color: "green", items: ["Li", "Na", "K", "Cs"] },
      { name: "Spectroscopy methods", color: "blue", items: ["IR", "NMR", "UV-Vis", "MS"] },
      { name: "Physical-organic extras", color: "purple", items: ["Hammett σ", "pKa", "KIE", "ρ value"] },
    ],
  },
  {
    id: "poc-6",
    theme: "lab",
    groups: [
      { name: "Glassware and transfer", color: "yellow", items: ["Erlenmeyer", "Schlenk", "Cannula", "Büchner"] },
      { name: "Flash column kit", color: "green", items: ["Silica", "Hexane", "EtOAc", "Rf"] },
      { name: "Drying agents", color: "blue", items: ["MgSO₄", "Na₂SO₄", "Sieves", "Dean–Stark"] },
      { name: "Recrystallization", color: "purple", items: ["Seed crystal", "Mother liquor", "Hot filtration", "Slow cool"] },
    ],
  },
  {
    id: "poc-7",
    theme: "spectra",
    groups: [
      { name: "NMR slang", color: "yellow", items: ["Downfield", "Upfield", "Multiplet", "Integration"] },
      { name: "Classic IR regions", color: "green", items: ["1700 cm⁻¹", "3300 cm⁻¹", "2100 cm⁻¹", "Fingerprint"] },
      { name: "Mass spec peaks", color: "blue", items: ["M⁺", "M+1", "Base peak", "Fragment"] },
      { name: "UV-Vis words", color: "purple", items: ["λmax", "Chromophore", "Bathochromic", "ε"] },
    ],
  },
  {
    id: "poc-8",
    theme: "mechanisms",
    groups: [
      { name: "SN2 tells", color: "yellow", items: ["Primary RX", "Backside", "Walden", "Concerted"] },
      { name: "SN1 tells", color: "green", items: ["Tertiary RX", "Carbocation", "Racemize", "Polar protic"] },
      { name: "E2 tells", color: "blue", items: ["Anti-periplanar", "Bulky base", "Alkene product", "One-step"] },
      { name: "EAS tells", color: "purple", items: ["FeBr₃", "Wheland", "Br₂", "σ-complex"] },
    ],
  },
  {
    id: "poc-9",
    theme: "named",
    groups: [
      { name: "C–C couplings", color: "yellow", items: ["Sonogashira", "Kumada", "Hiyama", "Buchwald"] },
      { name: "Rearrangements", color: "green", items: ["Beckmann", "Baeyer–Villiger", "Pinacol", "Favorskii"] },
      { name: "Olefinations", color: "blue", items: ["Horner–Wadsworth", "Tebbe", "Peterson", "Julia"] },
      { name: "Named reductions", color: "purple", items: ["Clemmensen", "Birch", "Luche", "Rosenmund"] },
    ],
  },
  {
    id: "poc-10",
    theme: "elements",
    groups: [
      { name: "Chalcogens", color: "yellow", items: ["O", "S", "Se", "Te"] },
      { name: "Pnictogens", color: "green", items: ["N", "P", "As", "Sb"] },
      { name: "Coinage metals", color: "blue", items: ["Cu", "Ag", "Au", "Rg"] },
      { name: "Alkaline earths", color: "purple", items: ["Be", "Mg", "Ca", "Ba"] },
    ],
  },
  {
    id: "poc-11",
    theme: "lab",
    groups: [
      { name: "Keep the air out", color: "yellow", items: ["N₂ line", "Glovebox", "Freeze–pump–thaw", "Septum"] },
      { name: "Purify the product", color: "green", items: ["Column", "Recrystallize", "Distill", "Prep HPLC"] },
      { name: "Bench clutter", color: "blue", items: ["Stir bar", "Syringe", "Hotplate", "Clamp"] },
      { name: "Often distilled dry", color: "purple", items: ["THF", "Et₂O", "Toluene", "Dioxane"] },
    ],
  },
  {
    id: "poc-12",
    theme: "mechanisms",
    groups: [
      { name: "Thermodynamic symbols", color: "yellow", items: ["ΔG", "ΔH", "ΔS", "Keq"] },
      { name: "Kinetic symbols", color: "green", items: ["k", "ΔG‡", "Eyring", "Rate law"] },
      { name: "LFER names", color: "blue", items: ["Hammett", "Taft", "Brønsted", "Swain–Lupton"] },
      { name: "Isotope-effect words", color: "purple", items: ["kH/kD", "Tunneling", "ZPE", "Primary KIE"] },
    ],
  },
  {
    id: "poc-13",
    theme: "spectra",
    groups: [
      { name: "2D NMR", color: "yellow", items: ["COSY", "HSQC", "HMBC", "NOESY"] },
      { name: "NMR setup", color: "green", items: ["CDCl₃", "TMS", "Lock", "Shims"] },
      { name: "MS ionization", color: "blue", items: ["EI", "ESI", "MALDI", "CI"] },
      { name: "IR bond stories", color: "purple", items: ["C=O", "O–H", "C≡C", "C–H stretch"] },
    ],
  },
  {
    id: "poc-14",
    theme: "named",
    groups: [
      { name: "5-membered heterocycles", color: "yellow", items: ["Furan", "Pyrrole", "Thiophene", "Imidazole"] },
      { name: "Six-membered N rings", color: "green", items: ["Pyridine", "Pyrimidine", "Pyrazine", "Pyridazine"] },
      { name: "Fused aromatics", color: "blue", items: ["Indole", "Quinoline", "Naphthalene", "Benzofuran"] },
      { name: "N-ligand celebrities", color: "purple", items: ["Bipyridine", "Phenanthroline", "Terpyridine", "Porphyrin"] },
    ],
  },
  {
    id: "poc-15",
    theme: "lab",
    groups: [
      { name: "Everyday acids", color: "yellow", items: ["TFA", "AcOH", "HCl", "TsOH"] },
      { name: "Everyday bases", color: "green", items: ["NEt₃", "Pyridine", "DBU", "K₂CO₃"] },
      { name: "Hydride / H• sources", color: "blue", items: ["Super-H", "Red-Al", "BH₃", "Et₃SiH"] },
      { name: "Temperature shorthand", color: "purple", items: ["rt", "0 °C", "reflux", "−78 °C"] },
    ],
  },
  {
    id: "poc-16",
    theme: "solvents",
    groups: [
      { name: "Chlorinated solvents", color: "yellow", items: ["DCM", "CHCl₃", "DCE", "CCl₄"] },
      { name: "Ethers", color: "green", items: ["THF", "Et₂O", "Dioxane", "MTBE"] },
      { name: "Alcohols", color: "blue", items: ["MeOH", "EtOH", "i-PrOH", "t-BuOH"] },
      { name: "Hydrocarbons", color: "purple", items: ["Hexane", "Pentane", "Toluene", "Benzene"] },
    ],
  },
  {
    id: "poc-17",
    theme: "named",
    groups: [
      { name: "Phosphine ligands", color: "yellow", items: ["PPh₃", "XPhos", "dppe", "BINAP"] },
      { name: "Precatalyst metals", color: "green", items: ["Pd(OAc)₂", "NiCl₂", "CuI", "RuCl₃"] },
      { name: "Cross-coupling steps", color: "blue", items: ["Oxidative addition", "Transmetalation", "Reductive elimination", "Ligand exchange"] },
      { name: "Common additives", color: "purple", items: ["Cs₂CO₃", "K₃PO₄", "AgOTf", "TBAB"] },
    ],
  },
  {
    id: "poc-18",
    theme: "mechanisms",
    groups: [
      { name: "Relative stereo words", color: "yellow", items: ["syn", "anti", "cis", "trans"] },
      { name: "Optical labels", color: "green", items: ["(+)", "(−)", "D", "L"] },
      { name: "Faces and approaches", color: "blue", items: ["Re", "Si", "endo", "exo"] },
      { name: "Conformations", color: "purple", items: ["chair", "boat", "gauche", "antiperiplanar"] },
    ],
  },
  {
    id: "poc-19",
    theme: "elements",
    groups: [
      { name: "Inert atmospheres", color: "yellow", items: ["N₂", "Ar", "He", "Vacuum"] },
      { name: "Reactive gases", color: "green", items: ["H₂", "O₂", "CO", "Cl₂"] },
      { name: "Hapticity labels", color: "blue", items: ["η¹", "η²", "η⁵", "η⁶"] },
      { name: "Electron-count slogans", color: "purple", items: ["18e", "16e", "d⁸", "d⁶"] },
    ],
  },
  {
    id: "poc-20",
    theme: "named",
    groups: [
      { name: "Named catalysts", color: "yellow", items: ["Wilkinson", "Grubbs", "Crabtree", "Vaska"] },
      { name: "Common fragments", color: "green", items: ["Cp", "CO", "PPh₃", "Hydride"] },
      { name: "Carbene families", color: "blue", items: ["Fischer", "Schrock", "NHC", "Arduengo"] },
      { name: "Metathesis words", color: "purple", items: ["RCM", "CM", "ROMP", "Enyne"] },
    ],
  },
  {
    id: "poc-21",
    theme: "lab",
    groups: [
      { name: "PPE", color: "yellow", items: ["Goggles", "Gloves", "Lab coat", "Closed shoes"] },
      { name: "Hazard pictograms", color: "green", items: ["Flammable", "Corrosive", "Toxic", "Oxidizer"] },
      { name: "Waste streams", color: "blue", items: ["Halogenated", "Aqueous", "Silica", "Sharps"] },
      { name: "If it spills", color: "purple", items: ["Absorb", "Neutralize", "Alert", "Evacuate"] },
    ],
  },
];

export function dealConnectionPuzzle(theme = "any", avoidId = "") {
  const themed = CONNECTION_PUZZLES.filter((puzzle) => theme === "any" || puzzle.theme === theme);
  const pool = themed.filter((puzzle) => puzzle.id !== avoidId);
  const list = pool.length ? pool : (themed.length ? themed : CONNECTION_PUZZLES);
  const puzzle = list[Math.floor(Math.random() * list.length)];
  return {
    ...puzzle,
    tiles: shuffle(puzzle.groups.flatMap((group) => group.items)),
  };
}

export const FUN = {
  wordleWin: (n) => [
    `Isolated in ${n} ${n === 1 ? "shot" : "shots"}.`,
    "That's the product.",
    "Yield looks quantitative.",
    "Green across the TLC.",
  ][Math.min(n - 1, 3)],
  wordleLose: (word) => `The starting material was ${word}.`,
  connYes: (name) => `Yes — ${name}. Spot to spot.`,
  connWin: "Four fractions, all clean.",
  connAlmost: ["One away — like 90% ee.", "One away. Recrystallize and try again."],
  connNo: ["That mixture doesn't isolate.", "Not a group. Check the TLC.", "Wrong flask."],
};

export const CONNECTION_LIVES = [
  { id: "sandbox", label: "Sandbox", lives: 8 },
  { id: "chill", label: "Chill", lives: 6 },
  { id: "classic", label: "Classic", lives: 4 },
  { id: "strict", label: "Strict", lives: 3 },
];

export const WORDLE_GUESS_OPTIONS = [4, 6, 8];
