/**
 * Placeholder medical documents (all made up) for the demo accounts:
 * real, openable files: PDFs with text, and PNG images drawn pixel by
 * pixel (a chest X-ray, an EKG strip). No extra packages needed.
 *
 *   seedDocuments(isoDay)   files for the demo patient, used by seed_demo.js
 *   node scripts/demo_documents.js
 *        writes the files for the doctor dashboard's offline demo
 *        (frontend/public/demo-documents/ + frontend/src/doctor/mockDocuments.json)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------------------------------------------------------- PDF
// Standard PDF fonts only know Latin-1, so diacritics are dropped (ș -> s).
const pdfText = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[„”“]/g, '"')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7e]/g, '?')
    .replace(/([\\()])/g, '\\$1');

// lines: strings, '' for a blank line, or { text, mono: true } for tables
function makePdf({ heading, subheading, lines }) {
  const ops = [
    'BT', '/F2 17 Tf', '50 785 Td', `(${pdfText(heading)}) Tj`,
    '/F1 10 Tf', '0 -18 Td', `(${pdfText(subheading)}) Tj`, 'ET',
    '0.6 G 1 w 50 755 m 545 755 l S',
    'BT', '50 740 Td', '14 TL'
  ];
  for (const line of lines) {
    const { text, mono } = typeof line === 'string' ? { text: line } : line;
    ops.push(mono ? '/F3 9.5 Tf' : '/F1 10.5 Tf', `T* (${pdfText(text)}) Tj`);
  }
  ops.push('ET', 'BT /F1 8 Tf 0.5 g 50 40 Td (Document demonstrativ TimiCareNow - toate datele sunt fictive.) Tj ET');
  const stream = ops.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let out = '%PDF-1.4\n';
  const offsets = objects.map((obj, i) => {
    const at = out.length;
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return at;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1'); // everything is ASCII, so offsets = bytes
}

// ---------------------------------------------------------------- PNG
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
// pixel(x, y) -> [r, g, b] (0..255)
function makePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      raw[row + 1 + x * 3] = r;
      raw[row + 2 + x * 3] = g;
      raw[row + 3 + x * 3] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8 bit, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// 1 inside, 0 outside, with a soft edge of the given width
const soft = (d, width = 0.12) => Math.min(1, Math.max(0, (1 - d) / width));
const ellipse = (x, y, cx, cy, rx, ry) => Math.hypot((x - cx) / rx, (y - cy) / ry);

// A stylised chest X-ray (PA view): bones bright, air-filled lungs dark
function makeXrayPng(seed = 0) {
  const W = 420;
  const H = 500;
  return makePng(W, H, (px, py) => {
    const x = (px / W) * 2 - 1; // -1..1
    const y = py / H; // 0..1
    const body = soft(ellipse(x, y, 0, 0.66, 0.95, 0.68), 0.25);
    let v = 0.04 + 0.42 * body;
    // lungs: darkest in the middle, fading towards the edges
    let lung = 0;
    for (const side of [-1, 1]) {
      const d = ellipse(x, y, side * 0.42, 0.5 + 0.08 * (y - 0.5), 0.29, 0.37);
      lung = Math.max(lung, soft(d, 0.45));
    }
    v -= 0.3 * lung;
    // heart shadow, towards the patient's left (image right), blending into the lung
    v += 0.2 * soft(ellipse(x, y, 0.13 + seed * 0.04, 0.7, 0.27 + seed * 0.05, 0.19), 0.5);
    // diaphragm: brighter under the lungs
    v += 0.12 * body * Math.min(1, Math.max(0, (y - 0.83 + 0.05 * Math.abs(x)) / 0.06));
    // spine, fading out at the top
    v += 0.16 * body * soft(Math.abs(x) / 0.075, 0.5) * Math.min(1, y * 3);
    // ribs: arcs over the lungs, fainter at the sides
    for (let k = 0; k < 9; k++) {
      const ry = 0.26 + k * 0.062 + 0.17 * x * x;
      const across = soft(Math.abs(x) / 0.85, 0.4) * (Math.abs(x) > 0.07 ? 1 : 0);
      v += 0.1 * across * soft(Math.abs(y - ry) / 0.013, 0.8);
    }
    // collarbones
    const cy = 0.19 + 0.07 * Math.abs(x);
    if (Math.abs(x) > 0.07 && Math.abs(x) < 0.66) v += 0.18 * soft(Math.abs(y - cy) / 0.016, 0.7);
    // vignette + faint film grain (deterministic)
    v *= 1 - 0.25 * Math.hypot(x, (y - 0.5) * 1.6) ** 2;
    v += 0.012 * Math.sin(px * 12.9898 + py * 78.233);
    const g = Math.round(Math.min(1, Math.max(0, v)) * 255);
    return [g, g, g];
  });
}

// A 10-second EKG strip on pink grid paper
function makeEkgPng() {
  const W = 900;
  const H = 260;
  const beat = (t) => {
    // one heartbeat, t in 0..1
    const g = (c, w, a) => a * Math.exp(-(((t - c) / w) ** 2));
    return g(0.18, 0.035, 0.12) + g(0.36, 0.008, -0.12) + g(0.4, 0.012, 1) + g(0.43, 0.01, -0.25) + g(0.66, 0.06, 0.28);
  };
  const traceY = (px) => H / 2 + 20 - beat(((px / W) * 12) % 1) * 95;
  return makePng(W, H, (px, py) => {
    const ty = traceY(px);
    const prev = traceY(Math.max(0, px - 1));
    const lo = Math.min(ty, prev) - 1.3;
    const hi = Math.max(ty, prev) + 1.3;
    if (py >= lo && py <= hi) return [20, 20, 30];
    if (px % 50 === 0 || py % 50 === 0) return [236, 150, 160];
    if (px % 10 === 0 || py % 10 === 0) return [248, 205, 210];
    return [255, 244, 245];
  });
}

// ---------------------------------------------------------------- content
const SPITAL = "Spitalul MedLife Medici's (Ambulatoriu)";
const EROILOR = 'Hyperclinica MedLife Timișoara – Eroilor';

const pdf = (category, title, fileName, date, content) => ({ category, title, fileName, date, mimeType: 'application/pdf', make: () => makePdf(content) });
const png = (category, title, fileName, date, make) => ({ category, title, fileName, date, mimeType: 'image/png', make });
const ro = (iso) => (iso ? iso.split('-').reverse().join('.') : '');

// The demo patient Maria Demo (seed_demo.js): mild asthma, allergic to penicillin
function mariaDocuments(isoDay) {
  const visit = isoDay(-30);
  const who = 'Pacient: Maria Demo, F, n. 12.05.1990';
  return [
    pdf('letter', 'Scrisoare medicală – astm bronșic', 'scrisoare-medicala.pdf', visit, {
      heading: 'SCRISOARE MEDICALĂ',
      subheading: `${SPITAL} · ${ro(visit)}`,
      lines: [
        who, '',
        'Motivul prezentării: dificultăți de respirație la efort, tuse seacă nocturnă.', '',
        'Diagnostic: Astm bronșic ușor, controlat.',
        'Alergii cunoscute: penicilină, polen.', '',
        'Investigații efectuate:',
        '  - spirometrie cu test bronhodilatator (anexat)',
        '  - radiografie toracică: fără modificări pleuro-pulmonare',
        '  - hemoleucogramă: eozinofile ușor crescute', '',
        'Tratament recomandat:',
        '  - Salbutamol inhalator 100 mcg, 1-2 pufuri la nevoie', '',
        'Recomandări: evitarea expunerii la polen, control peste 6 luni.', '',
        'Dr. Andrei Demo, Medicină internă'
      ]
    }),
    pdf('other', 'Spirometrie', 'spirometrie.pdf', visit, {
      heading: 'BULETIN DE SPIROMETRIE',
      subheading: `${SPITAL} · ${ro(visit)}`,
      lines: [
        who, 'Înălțime 168 cm, greutate 61 kg', '',
        { mono: true, text: 'Parametru        Pre-BD   Post-BD   % prezis' },
        { mono: true, text: '-------------------------------------------' },
        { mono: true, text: 'FVC (L)           3.42     3.51      98%' },
        { mono: true, text: 'FEV1 (L)          2.71     3.02      91%' },
        { mono: true, text: 'FEV1/FVC (%)      79       86        -' },
        { mono: true, text: 'PEF (L/s)         6.10     6.85      93%' }, '',
        'Concluzie: spirometrie normală; răspuns bronhodilatator semnificativ (+11%).',
        'Aspect compatibil cu astm bronșic.'
      ]
    }),
    png('xray', 'Radiografie toracică', 'radiografie-toracica.png', isoDay(-32), () => makeXrayPng(0)),
    pdf('lab', 'Hemoleucogramă completă', 'hemoleucograma.pdf', isoDay(-35), {
      heading: 'BULETIN DE ANALIZE MEDICALE',
      subheading: `Laborator ${EROILOR} · recoltat ${ro(isoDay(-35))}`,
      lines: [
        who, '',
        { mono: true, text: 'Analiză                Rezultat   U.M.       Interval' },
        { mono: true, text: '------------------------------------------------------' },
        { mono: true, text: 'Hemoglobină            13.4       g/dL       12.0-15.5' },
        { mono: true, text: 'Hematocrit             40.1       %          36-46' },
        { mono: true, text: 'Leucocite              7.2        10^3/uL    4.0-10.0' },
        { mono: true, text: 'Eozinofile             6.8 *      %          0.5-5.0' },
        { mono: true, text: 'Trombocite             265        10^3/uL    150-400' },
        { mono: true, text: 'VSH                    9          mm/h       2-20' },
        { mono: true, text: 'Proteina C reactivă    1.2        mg/L       < 5' }, '',
        '* valoare în afara intervalului de referință'
      ]
    }),
    pdf('prescription', 'Rețetă – Salbutamol', 'reteta-salbutamol.pdf', visit, {
      heading: 'PRESCRIPȚIE MEDICALĂ',
      subheading: `${SPITAL} · ${ro(visit)}`,
      lines: [
        who, 'Diagnostic: Astm bronșic ușor (J45.0)', '',
        'Rp/',
        '  1. Salbutamol 100 mcg/doză, spray inhalator presurizat',
        '     D.S. 1-2 pufuri la nevoie, max. 8 pufuri/zi', '',
        'Valabilă 30 de zile.', '',
        'Dr. Andrei Demo, Medicină internă'
      ]
    })
  ];
}

// The doctor dashboard's offline demo patients (frontend/src/doctor/mockData.js).
// dayOffset: days from today, so the dates stay recent.
const MOCK = {
  p1: [
    { ...pdf('lab', 'Analize – HbA1c și profil lipidic', 'p1-analize.pdf', null, {
      heading: 'BULETIN DE ANALIZE MEDICALE', subheading: 'Laborator Demo Timișoara',
      lines: ['Pacient: Ion Ionescu, M, n. 14.03.1961', '',
        { mono: true, text: 'Analiză                Rezultat   U.M.     Interval' },
        { mono: true, text: '----------------------------------------------------' },
        { mono: true, text: 'Glicemie à jeun        138 *      mg/dL    70-100' },
        { mono: true, text: 'HbA1c                  7.1 *      %        < 5.7' },
        { mono: true, text: 'Colesterol total       212 *      mg/dL    < 200' },
        { mono: true, text: 'LDL colesterol         131 *      mg/dL    < 100' },
        { mono: true, text: 'HDL colesterol         46         mg/dL    > 40' },
        { mono: true, text: 'Trigliceride           174 *      mg/dL    < 150' },
        { mono: true, text: 'Creatinină             0.98       mg/dL    0.7-1.2' }, '',
        '* valoare în afara intervalului de referință'] }), dayOffset: -125 },
    { ...png('other', 'EKG de repaus', 'p1-ekg.png', null, makeEkgPng), dayOffset: -120 },
    { ...pdf('letter', 'Scrisoare medicală – control cardiologic', 'p1-scrisoare.pdf', null, {
      heading: 'SCRISOARE MEDICALĂ', subheading: 'Clinica Demo Timișoara · Cardiologie',
      lines: ['Pacient: Ion Ionescu, M, n. 14.03.1961', '',
        'Diagnostic: HTA grad II, controlată. Diabet zaharat tip 2.',
        'Alergii: penicilină.', '',
        'EKG: ritm sinusal, AV 72/min, fără modificări de fază terminală.',
        'TA la cabinet: 135/85 mmHg.', '',
        'Tratament: Perindopril 5 mg dimineața, Metformin 1000 mg x 2/zi.',
        'Recomandări: dietă hiposodată, control peste 4 luni.', '',
        'Dr. Ana Popescu, Cardiologie'] }), dayOffset: -120 }
  ],
  p3: [
    { ...pdf('other', 'Holter EKG 24h', 'p3-holter.pdf', null, {
      heading: 'RAPORT HOLTER EKG 24 ORE', subheading: 'Clinica Demo Timișoara',
      lines: ['Pacient: Andrei Popa, M, n. 23.11.1975', '',
        { mono: true, text: 'Durată înregistrare      23 h 48 min' },
        { mono: true, text: 'AV medie / min / max     78 / 52 / 141 bpm' },
        { mono: true, text: 'Episoade FiA             3 (total 2 h 12 min)' },
        { mono: true, text: 'Extrasistole ventric.    214 izolate' },
        { mono: true, text: 'Pauze > 2.5 s            0' }, '',
        'Concluzie: fibrilație atrială paroxistică, episoade simptomatice',
        'corelate cu jurnalul pacientului (palpitații).'] }), dayOffset: -40 },
    { ...pdf('letter', 'Bilet de externare – Spital Demo', 'p3-externare.pdf', null, {
      heading: 'BILET DE EXTERNARE', subheading: 'Spital Demo · Unitatea de Primiri Urgențe',
      lines: ['Pacient: Andrei Popa, M, n. 23.11.1975', '',
        'Motivul internării: amețeli, lipotimie la domiciliu.',
        'Diagnostic la externare: Lipotimie. Fără leziuni traumatice.',
        'CT cerebral nativ: fără modificări acute.', '',
        'Externat după 24 h de monitorizare, stare bună.',
        'Recomandări: control cardiologic, hidratare corespunzătoare.'] }), dayOffset: -400 }
  ],
  p4: [
    { ...pdf('ultrasound', 'Ecocardiografie transtoracică', 'p4-ecocardiografie.pdf', null, {
      heading: 'BULETIN DE ECOCARDIOGRAFIE', subheading: 'Clinica Demo Timișoara · Cardiologie',
      lines: ['Pacient: Elena Dumitrescu, F, n. 30.01.1953', '',
        { mono: true, text: 'FEVS (Simpson)           38%' },
        { mono: true, text: 'VS diastolic             58 mm' },
        { mono: true, text: 'AS                       44 mm' },
        { mono: true, text: 'Insuficiență mitrală     grad II' },
        { mono: true, text: 'PSAP estimată            38 mmHg' }, '',
        'Concluzie: disfuncție sistolică VS moderată, IM grad II.',
        'Fără lichid pericardic.'] }), dayOffset: -95 },
    { ...png('xray', 'Radiografie toracică', 'p4-radiografie.png', null, () => makeXrayPng(1)), dayOffset: -95 },
    { ...pdf('other', 'Osteodensitometrie DXA', 'p4-dxa.pdf', null, {
      heading: 'OSTEODENSITOMETRIE (DXA)', subheading: 'Centrul de Imagistică Demo',
      lines: ['Pacient: Elena Dumitrescu, F, n. 30.01.1953', '',
        { mono: true, text: 'Regiune          DMO (g/cm2)   T-score' },
        { mono: true, text: '--------------------------------------' },
        { mono: true, text: 'Coloană L1-L4    0.781         -2.9' },
        { mono: true, text: 'Col femural      0.642         -2.6' }, '',
        'Concluzie: osteoporoză.'] }), dayOffset: -210 }
  ],
  p5: [
    { ...pdf('other', 'Spirometrie', 'p5-spirometrie.pdf', null, {
      heading: 'BULETIN DE SPIROMETRIE', subheading: 'Policlinica Demo',
      lines: ['Pacient: Radu Constantin, M, n. 09.05.1995', '',
        { mono: true, text: 'Parametru        Pre-BD   Post-BD' },
        { mono: true, text: '---------------------------------' },
        { mono: true, text: 'FVC (L)           4.95     5.02' },
        { mono: true, text: 'FEV1 (L)          3.61     4.08' },
        { mono: true, text: 'FEV1/FVC (%)      73       81' }, '',
        'Concluzie: sindrom obstructiv ușor, reversibil (+13%).'] }), dayOffset: -200 },
    { ...pdf('prescription', 'Rețetă – Salbutamol', 'p5-reteta.pdf', null, {
      heading: 'PRESCRIPȚIE MEDICALĂ', subheading: 'Policlinica Demo',
      lines: ['Pacient: Radu Constantin, M, n. 09.05.1995', '',
        'Rp/', '  1. Salbutamol 100 mcg/doză, spray inhalator',
        '     D.S. 1-2 pufuri la nevoie', '', 'Dr. Ioana Vlad'] }), dayOffset: -200 }
  ]
};

// For seed_demo.js: [{ category, title, fileName, mimeType, date, data }]
function seedDocuments(isoDay) {
  return mariaDocuments(isoDay).map(({ make, ...doc }) => ({ ...doc, data: make() }));
}

function writeMockFiles() {
  const root = path.join(__dirname, '..', '..', 'frontend');
  const dir = path.join(root, 'public', 'demo-documents');
  fs.mkdirSync(dir, { recursive: true });
  const index = {};
  let id = 1;
  for (const [patientId, docs] of Object.entries(MOCK)) {
    index[patientId] = docs.map(({ make, date, ...doc }) => {
      const data = make();
      fs.writeFileSync(path.join(dir, doc.fileName), data);
      return { id: id++, ...doc, size: data.length };
    });
  }
  const out = path.join(root, 'src', 'doctor', 'mockDocuments.json');
  fs.writeFileSync(out, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Scrise ${id - 1} fișiere în ${dir}\nși lista în ${out}`);
}

if (require.main === module) writeMockFiles();

module.exports = { seedDocuments, makePdf, makePng, makeXrayPng, makeEkgPng };
