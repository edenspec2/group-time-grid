const STROKE = { stroke: "currentColor", strokeWidth: 2.2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

function Svg({ label, children, viewBox = "0 0 220 130" }) {
  return (
    <svg className="molecule" viewBox={viewBox} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function Atom({ x, y, t, fill = "#9a3412" }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={fill} fontSize="16" fontWeight="700" fontFamily="Segoe UI, sans-serif">
      {t}
    </text>
  );
}

const DRAWINGS = {
  ethanol: (
    <Svg label="Ethanol">
      <path d="M28 78 H86 L128 42" {...STROKE} />
      <Atom x="148" y="36" t="OH" />
    </Svg>
  ),
  acetone: (
    <Svg label="Acetone">
      <path d="M30 86 H86 L128 86" {...STROKE} />
      <path d="M86 86 V44" {...STROKE} />
      <Atom x="86" y="28" t="O" />
    </Svg>
  ),
  acetic: (
    <Svg label="Acetic acid">
      <path d="M28 86 H84" {...STROKE} />
      <path d="M84 86 L118 54" {...STROKE} />
      <path d="M84 86 L124 112" {...STROKE} />
      <Atom x="136" y="48" t="O" />
      <Atom x="144" y="112" t="OH" />
    </Svg>
  ),
  ester: (
    <Svg label="Methyl acetate">
      <path d="M22 86 H72" {...STROKE} />
      <path d="M72 86 L104 52" {...STROKE} />
      <path d="M72 86 L112 112" {...STROKE} />
      <path d="M132 112 H176" {...STROKE} />
      <Atom x="122" y="46" t="O" />
      <Atom x="122" y="112" t="O" />
    </Svg>
  ),
  aldehyde: (
    <Svg label="Acetaldehyde">
      <path d="M36 86 H92 L128 86" {...STROKE} />
      <path d="M92 86 V46" {...STROKE} />
      <Atom x="92" y="30" t="O" />
      <Atom x="148" y="86" t="H" fill="#171411" />
    </Svg>
  ),
  amine: (
    <Svg label="Ethylamine">
      <path d="M36 78 H94 L136 78" {...STROKE} />
      <Atom x="158" y="78" t="NH2" />
    </Svg>
  ),
  benzene: (
    <Svg label="Benzene" viewBox="0 0 220 140">
      <polygon points="110,18 166,50 166,114 110,146 54,114 54,50" {...STROKE} />
      <circle cx="110" cy="82" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </Svg>
  ),
  alkene: (
    <Svg label="Propene">
      <path d="M28 86 H78" {...STROKE} />
      <path d="M78 80 H132" {...STROKE} />
      <path d="M78 92 H132" {...STROKE} />
      <path d="M132 86 H182" {...STROKE} />
    </Svg>
  ),
  alkyne: (
    <Svg label="Propyne">
      <path d="M28 86 H76" {...STROKE} />
      <path d="M76 78 H136" {...STROKE} />
      <path d="M76 86 H136" {...STROKE} />
      <path d="M76 94 H136" {...STROKE} />
      <Atom x="154" y="86" t="H" fill="#171411" />
    </Svg>
  ),
  ether: (
    <Svg label="Diethyl ether">
      <path d="M22 86 H70" {...STROKE} />
      <path d="M92 86 H140 L176 86" {...STROKE} />
      <Atom x="81" y="86" t="O" />
    </Svg>
  ),
  amide: (
    <Svg label="Acetamide">
      <path d="M28 86 H78" {...STROKE} />
      <path d="M78 86 L112 52" {...STROKE} />
      <path d="M78 86 L118 112" {...STROKE} />
      <Atom x="130" y="46" t="O" />
      <Atom x="140" y="112" t="NH2" />
    </Svg>
  ),
  nitrile: (
    <Svg label="Acetonitrile">
      <path d="M40 86 H96" {...STROKE} />
      <path d="M96 78 H150" {...STROKE} />
      <path d="M96 86 H150" {...STROKE} />
      <path d="M96 94 H150" {...STROKE} />
      <Atom x="168" y="86" t="N" />
    </Svg>
  ),
  phenol: (
    <Svg label="Phenol" viewBox="0 0 220 150">
      <polygon points="86,18 142,50 142,114 86,146 30,114 30,50" {...STROKE} />
      <path d="M142 82 H178" {...STROKE} />
      <Atom x="196" y="82" t="OH" />
    </Svg>
  ),
};

export default function Molecule({ id }) {
  return DRAWINGS[id] || null;
}
