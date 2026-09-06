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
