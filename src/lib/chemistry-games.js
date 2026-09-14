export const CHEMISTRY_GAMES = [
  {
    id: "groups",
    title: "Spot the group",
    blurb: "Name the functional group from a line drawing. Good warm-up while people fill the grid.",
    questions: [
      { molecule: "ethanol", prompt: "What functional group is this?", choices: ["Alcohol", "Ether", "Aldehyde", "Phenol"], answer: "Alcohol", explain: "A hydroxyl on an sp3 carbon is an alcohol. Ethanol is the simplest one people still write as EtOH." },
      { molecule: "acetone", prompt: "What functional group is this?", choices: ["Aldehyde", "Ketone", "Ester", "Carboxylic acid"], answer: "Ketone", explain: "A carbonyl with two carbon substituents is a ketone. Acetone is the textbook case." },
      { molecule: "acetic", prompt: "What functional group is this?", choices: ["Ester", "Amide", "Carboxylic acid", "Ketone"], answer: "Carboxylic acid", explain: "A carbonyl bound to OH is a carboxylic acid. Acetic acid sits near pKa 4.8." },
      { molecule: "ester", prompt: "What functional group is this?", choices: ["Ether", "Ester", "Anhydride", "Acetal"], answer: "Ester", explain: "A carbonyl bound to OR is an ester. The second oxygen is not a hydroxyl." },
      { molecule: "aldehyde", prompt: "What functional group is this?", choices: ["Ketone", "Carboxylic acid", "Aldehyde", "Acetal"], answer: "Aldehyde", explain: "A carbonyl with one hydrogen is an aldehyde. The terminal H is the tell." },
      { molecule: "amine", prompt: "What functional group is this?", choices: ["Amide", "Nitrile", "Imine", "Amine"], answer: "Amine", explain: "A nitrogen bound only to carbon and hydrogen is an amine, not an amide." },
      { molecule: "benzene", prompt: "What is this ring system?", choices: ["Cyclohexane", "Aromatic benzene", "Cyclohexene", "Pyridine"], answer: "Aromatic benzene", explain: "The hexagon with the inner ring is benzene: a 6π aromatic system." },
      { molecule: "alkene", prompt: "What functional group is this?", choices: ["Alkene", "Alkyne", "Allene", "Aromatic"], answer: "Alkene", explain: "The double line between carbons is a C=C. Two parallel strokes mean alkene, three mean alkyne." },
      { molecule: "alkyne", prompt: "What functional group is this?", choices: ["Alkene", "Nitrile", "Alkyne", "Allene"], answer: "Alkyne", explain: "Three parallel bonds mark a C≡C. A terminal alkyne still has that acidic proton near pKa 25." },
      { molecule: "ether", prompt: "What functional group is this?", choices: ["Alcohol", "Ester", "Epoxide", "Ether"], answer: "Ether", explain: "An oxygen between two carbons, with no carbonyl, is an ether." },
      { molecule: "amide", prompt: "What functional group is this?", choices: ["Amine", "Amide", "Imine", "Nitrile"], answer: "Amide", explain: "A carbonyl bound to nitrogen is an amide. Resonance with nitrogen makes it far less basic than an amine." },
      { molecule: "nitrile", prompt: "What functional group is this?", choices: ["Alkyne", "Isocyanide", "Nitrile", "Imine"], answer: "Nitrile", explain: "A carbon–nitrogen triple bond is a nitrile (cyano). The terminal atom is N, not H." },
      { molecule: "phenol", prompt: "What functional group is this?", choices: ["Alcohol", "Enol", "Phenol", "Ether"], answer: "Phenol", explain: "OH on an aromatic ring is a phenol, not a simple alcohol. The anion is resonance-stabilized." },
    ],
  },
  {
    id: "pka",
    title: "Which is more acidic?",
    blurb: "Physical organic ranking: pick the stronger acid. Think anion stability, not the formula weight.",
    questions: [
      { prompt: "Which is more acidic in water?", choices: ["Ethanol", "Acetic acid", "Acetone", "t-Butanol"], answer: "Acetic acid", explain: "Carboxylic acids (pKa ~5) beat alcohols (~16) and ketones (~20). The carboxylate is resonance-stabilized." },
      { prompt: "Which is more acidic?", choices: ["Phenol", "Cyclohexanol", "Anisole", "Benzene"], answer: "Phenol", explain: "Phenol is near pKa 10 because the phenoxide is aromatic-resonance stabilized. Cyclohexanol is a normal alcohol." },
      { prompt: "Which C–H is more acidic?", choices: ["Ethylene", "Propyne (terminal)", "Propane", "Benzene"], answer: "Propyne (terminal)", explain: "A terminal alkyne sits near pKa 25. The conjugate base has the lone pair in an sp orbital, closer to the nucleus." },
      { prompt: "Which is more acidic?", choices: ["p-Nitrophenol", "Phenol", "p-Methoxyphenol", "Anisole"], answer: "p-Nitrophenol", explain: "A para nitro group withdraws electron density and stabilizes phenoxide. Methoxy does the opposite." },
      { prompt: "Which proton is more acidic?", choices: ["Cyclopentadiene", "Cyclopentane", "Cyclohexene", "Naphthalene"], answer: "Cyclopentadiene", explain: "Deprotonation gives the aromatic cyclopentadienyl anion (6π). That drops the pKa to about 16, remarkable for a C–H." },
      { prompt: "Which is more acidic?", choices: ["HCl", "Acetic acid", "HF", "Water"], answer: "HCl", explain: "HCl is a strong acid in water (fully dissociated). HF is weaker because of a strong H–F bond, despite fluorine’s electronegativity." },
      { prompt: "Which α-proton is more acidic?", choices: ["Acetone", "Ethyl acetate", "N,N-Dimethylacetamide", "Propane"], answer: "Acetone", explain: "Ketone α-protons (~20) are more acidic than ester (~25) or amide (~30) α-protons. The amide carbonyl is already tied up in N resonance." },
      { prompt: "Which is more acidic?", choices: ["p-Nitrobenzoic acid", "Benzoic acid", "p-Methylbenzoic acid", "Phenol"], answer: "p-Nitrobenzoic acid", explain: "Electron-withdrawing groups stabilize the carboxylate. Hammett σ for p-NO2 is large and positive." },
      { prompt: "In DMSO, which is more acidic?", choices: ["Fluorene", "Diphenylmethane", "Toluene", "Cyclohexane"], answer: "Fluorene", explain: "The fluorenyl anion is aromatic (14π if you count the cyclopentadienyl-like core). That is classic physical-organic anion stabilization." },
      { prompt: "Which is more acidic?", choices: ["Trifluoroacetic acid", "Acetic acid", "Formic acid", "Phenol"], answer: "Trifluoroacetic acid", explain: "Three fluorines inductively stabilize the anion. TFA is a strong organic acid, far below acetic acid." },
    ],
  },
  {
    id: "mechanism",
    title: "Mechanism mix-up",
    blurb: "SN1, SN2, E2, and a few concerteds. Pick the best description, not the catchiest arrow.",
    questions: [
      { prompt: "Primary alkyl bromide + NaI in acetone most likely goes by:", choices: ["SN1", "SN2", "E1", "Radical chain"], answer: "SN2", explain: "Primary electrophile, good nucleophile, polar aprotic solvent: backside attack SN2. Finkelstein conditions are the classic." },
      { prompt: "t-Butyl bromide in hot ethanol mainly gives:", choices: ["SN2 substitution", "E2 / E1 elimination", "Hydroboration", "Benzyne"], answer: "E2 / E1 elimination", explain: "Tertiary substrate cannot do SN2. Weak nucleophile/base and heat favor elimination to isobutene." },
      { prompt: "E2 from a cyclohexane halide is fastest when the leaving group is:", choices: ["Equatorial, gauche to H", "Axial, anti-periplanar to H", "Equatorial, syn to H", "Anywhere; stereochemistry does not matter"], answer: "Axial, anti-periplanar to H", explain: "E2 wants an anti-periplanar H–C–C–LG arrangement. On a chair, that means both groups axial." },
      { prompt: "Hydroboration–oxidation of a terminal alkene gives:", choices: ["Markovnikov alcohol, anti addition", "Anti-Markovnikov alcohol, syn addition", "Markovnikov alcohol, syn addition", "The ketone"], answer: "Anti-Markovnikov alcohol, syn addition", explain: "BH3 adds syn; oxidation retains that stereochemistry and places OH on the less substituted carbon." },
      { prompt: "A Diels–Alder reaction is best described as:", choices: ["Stepwise ionic", "Concerted [4+2] cycloaddition", "Radical chain", "Electrocyclic ring opening"], answer: "Concerted [4+2] cycloaddition", explain: "It is a pericyclic [4+2]. Stereochemistry of diene and dienophile is retained (suprafacial on both)." },
      { prompt: "Rate of SN1 on an alkyl halide usually increases with:", choices: ["Stronger nucleophile", "More substituted carbocation", "Better backside trajectory", "Less polar solvent"], answer: "More substituted carbocation", explain: "The slow step is ionization. Tertiary and resonance-stabilized cations form faster. Nucleophile strength drops out of the rate law." },
      { prompt: "Bromination of benzene with Br2/FeBr3 is:", choices: ["Nucleophilic aromatic substitution", "Electrophilic aromatic substitution", "SN2 on the ring", "A radical aromatic substitution only"], answer: "Electrophilic aromatic substitution", explain: "FeBr3 makes Br+ equivalent. The Wheland intermediate (arenium ion) is the physical-organic fingerprint of EAS." },
      { prompt: "A benzylic radical is unusually stable because of:", choices: ["Inductive donation only", "Hyperconjugation only", "Resonance into the ring", "Aromaticity of the radical itself"], answer: "Resonance into the ring", explain: "The unpaired electron is delocalized into the π system. That is why NBS bromination prefers the benzylic position." },
      { prompt: "Walden inversion is the stereochemical signature of:", choices: ["SN1", "SN2", "E1", "Norrish I"], answer: "SN2", explain: "Backside attack inverts the tetrahedral center. SN1 racemizes via a planar cation." },
      { prompt: "Which condition most favors E2 over SN2 on a secondary bromide?", choices: ["Iodide in acetone", "Methanol, cold", "t-Butoxide, heat", "Water, 0 °C"], answer: "t-Butoxide, heat", explain: "A bulky strong base and heat push elimination. Small nucleophiles in polar aprotic solvent stay on the SN2 path." },
    ],
  },
];

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealRound(questions, count = 8) {
  return shuffle(questions).slice(0, Math.min(count, questions.length)).map((question) => ({
    ...question,
    choices: shuffle(question.choices),
  }));
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
      "TOLYL", "BROMO",
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
    ], 6),
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
  HAMMET: "Linear free energy",
};

export const WORDLE_GUESSES = new Set(WORDLE_PACKS.flatMap((pack) => pack.words));

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

export const CONNECTION_THEMES = [
  { id: "any", label: "Surprise me" },
  { id: "lab", label: "Lab bench" },
  { id: "mechanisms", label: "Mechanisms" },
  { id: "elements", label: "Elements" },
  { id: "spectra", label: "Spectra" },
  { id: "named", label: "Named reactions" },
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
  { id: "chill", label: "Chill", lives: 6 },
  { id: "classic", label: "Classic", lives: 4 },
  { id: "strict", label: "Strict", lives: 3 },
];
