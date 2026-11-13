// =============================================================
//  SYMPTOM GUIDE ("Ce te doare?")
//  Each symptom:
//    id          unique name
//    icon        emoji
//    level       "emergency" -> shows "Call 112" first
//                "urgent"    -> see a doctor today (shows places open now)
//                "normal"    -> regular appointment
//    labels      { ro, en, hu } text shown on the button
//    keywords    extra words people might type (any language, no need
//                for diacritics: "durere in piept" also matches)
//    specialties Romanian specialty names from the database
//                (they must match specialties.name_ro exactly)
//
//  This is an orientation tool, NOT a diagnosis. Keep red-flag
//  symptoms at level "emergency".
// =============================================================

export const SYMPTOMS = [
  // ---------------------------------------------------------- EMERGENCIES (112)
  {
    id: "chest-pain",
    icon: "💔",
    level: "emergency",
    labels: { ro: "Durere sau apăsare în piept", en: "Chest pain or pressure", hu: "Mellkasi fájdalom vagy nyomás" },
    keywords: ["piept", "inima", "infarct", "chest", "heart attack", "mellkas", "sziv", "infarktus"],
    specialties: ["Cardiologie"],
  },
  {
    id: "breathing",
    icon: "😮‍💨",
    level: "emergency",
    labels: { ro: "Nu pot respira / mă sufoc", en: "Can't breathe / choking", hu: "Nem kapok levegőt / fulladás" },
    keywords: ["respir", "sufoc", "aer", "breath", "choking", "levego", "fullad"],
    specialties: ["Pneumologie"],
  },
  {
    id: "stroke",
    icon: "🧠",
    level: "emergency",
    labels: {
      ro: "Față strâmbă, slăbiciune pe o parte, vorbire neclară",
      en: "Face drooping, weakness on one side, slurred speech",
      hu: "Arc lecsüngése, egyoldali gyengeség, elmosódott beszéd",
    },
    keywords: ["avc", "accident vascular", "paralizie", "amorteala brusca", "stroke", "paralysis", "szelutes", "beszedzavar"],
    specialties: ["Neurologie"],
  },
  {
    id: "unconscious",
    icon: "😵",
    level: "emergency",
    labels: { ro: "Leșin / pierderea cunoștinței", en: "Fainting / loss of consciousness", hu: "Ájulás / eszméletvesztés" },
    keywords: ["lesin", "lesinat", "inconstient", "convulsii", "faint", "unconscious", "seizure", "ajul", "eszmelet", "gorcs"],
    specialties: ["Neurologie", "Cardiologie"],
  },
  {
    id: "bleeding",
    icon: "🩸",
    level: "emergency",
    labels: {
      ro: "Sângerare puternică sau accident grav",
      en: "Heavy bleeding or serious accident",
      hu: "Erős vérzés vagy súlyos baleset",
    },
    keywords: ["sangerare", "sange", "accident", "ranit", "bleeding", "blood", "injury", "verzes", "baleset", "serules"],
    specialties: ["Chirurgie generală"],
  },
  {
    id: "anaphylaxis",
    icon: "🐝",
    level: "emergency",
    labels: {
      ro: "Umflarea buzelor, limbii sau gâtului (alergie gravă)",
      en: "Swollen lips, tongue or throat (severe allergy)",
      hu: "Ajak-, nyelv- vagy torokduzzanat (súlyos allergia)",
    },
    keywords: ["umflat", "soc anafilactic", "intepatura", "swelling", "anaphylaxis", "sting", "duzzanat", "anafilaxia", "csipes"],
    specialties: ["Alergologie"],
  },
  {
    id: "self-harm",
    icon: "🆘",
    level: "emergency",
    labels: {
      ro: "Gânduri de a-mi face rău",
      en: "Thoughts of harming myself",
      hu: "Önártalmi gondolatok",
    },
    keywords: ["sinucidere", "nu mai vreau sa traiesc", "suicide", "harm myself", "ongyilkos", "artani magamnak"],
    specialties: ["Psihiatrie", "Psihologie / Psihoterapie"],
  },

  // ---------------------------------------------------------- SEE A DOCTOR TODAY
  {
    id: "child-fever",
    icon: "🤒",
    level: "urgent",
    labels: { ro: "Copil cu febră mare", en: "Child with a high fever", hu: "Magas lázas gyermek" },
    keywords: ["copil", "bebelus", "febra", "temperatura", "child", "baby", "fever", "gyerek", "baba", "laz"],
    specialties: ["Pediatrie"],
  },
  {
    id: "injury",
    icon: "🦴",
    level: "urgent",
    labels: { ro: "Fractură, entorsă sau lovitură", en: "Broken bone, sprain or knock", hu: "Törés, ficam vagy ütés" },
    keywords: ["fractura", "rupt", "entorsa", "luxatie", "cazatura", "fracture", "broken", "sprain", "fall", "tores", "ficam", "eses"],
    specialties: ["Ortopedie-Traumatologie"],
  },
  {
    id: "toothache",
    icon: "🦷",
    level: "urgent",
    labels: {
      ro: "Durere de dinți puternică sau obraz umflat",
      en: "Severe toothache or swollen cheek",
      hu: "Erős fogfájás vagy dagadt arc",
    },
    keywords: ["dinte", "masea", "abces", "carie", "tooth", "dental", "abscess", "fog", "fogfajas", "tályog"],
    specialties: ["Stomatologie"],
  },

  // ---------------------------------------------------------- COMMON PROBLEMS
  {
    id: "cold-flu",
    icon: "🤧",
    level: "normal",
    labels: { ro: "Răceală, gripă, febră", en: "Cold, flu, fever", hu: "Megfázás, influenza, láz" },
    keywords: ["raceala", "gripa", "febra", "viroza", "cold", "flu", "fever", "megfazas", "influenza", "laz"],
    specialties: ["Medicina familiei", "Medicină internă"],
  },
  {
    id: "cough",
    icon: "😷",
    level: "normal",
    labels: { ro: "Tuse care nu trece, respirație grea", en: "Persistent cough, shortness of breath", hu: "Tartós köhögés, nehézlégzés" },
    keywords: ["tuse", "astm", "bronsita", "plamani", "cough", "asthma", "lungs", "kohoges", "asztma", "tudo"],
    specialties: ["Pneumologie", "Alergologie"],
  },
  {
    id: "heart",
    icon: "❤️",
    level: "normal",
    labels: { ro: "Palpitații, tensiune mare", en: "Palpitations, high blood pressure", hu: "Szívdobogás, magas vérnyomás" },
    keywords: ["palpitatii", "tensiune", "hipertensiune", "puls", "palpitations", "blood pressure", "pulse", "vernyomas", "szivdobogas"],
    specialties: ["Cardiologie"],
  },
  {
    id: "skin",
    icon: "🧴",
    level: "normal",
    labels: { ro: "Erupție, mâncărimi, acnee, alunițe", en: "Rash, itching, acne, moles", hu: "Kiütés, viszketés, pattanás, anyajegy" },
    keywords: ["piele", "eruptie", "mancarime", "acnee", "alunita", "eczema", "skin", "rash", "itch", "acne", "mole", "bor", "kiutes", "viszketes"],
    specialties: ["Dermatovenerologie"],
  },
  {
    id: "stomach",
    icon: "🤢",
    level: "normal",
    labels: { ro: "Dureri de burtă, arsuri, digestie", en: "Stomach pain, heartburn, digestion", hu: "Hasfájás, gyomorégés, emésztés" },
    keywords: ["stomac", "burta", "arsuri", "greata", "diaree", "constipatie", "stomach", "nausea", "diarrhea", "has", "gyomor", "hanyinger"],
    specialties: ["Gastroenterologie"],
  },
  {
    id: "head",
    icon: "🤕",
    level: "normal",
    labels: { ro: "Dureri de cap, amețeli, amorțeli", en: "Headaches, dizziness, numbness", hu: "Fejfájás, szédülés, zsibbadás" },
    keywords: ["cap", "migrena", "ameteala", "amorteala", "headache", "migraine", "dizzy", "numb", "fejfajas", "migren", "szedules"],
    specialties: ["Neurologie"],
  },
  {
    id: "joints",
    icon: "🦵",
    level: "normal",
    labels: { ro: "Dureri de spate sau de articulații", en: "Back or joint pain", hu: "Hát- vagy ízületi fájdalom" },
    keywords: ["spate", "articulatii", "genunchi", "umar", "coloana", "back", "joint", "knee", "shoulder", "hat", "izulet", "terd"],
    specialties: ["Ortopedie-Traumatologie", "Reumatologie", "Recuperare medicală / Kinetoterapie"],
  },
  {
    id: "eyes",
    icon: "👁️",
    level: "normal",
    labels: { ro: "Probleme cu ochii sau vederea", en: "Eye or vision problems", hu: "Szem- vagy látásproblémák" },
    keywords: ["ochi", "vedere", "ochelari", "eye", "vision", "glasses", "szem", "latas", "szemuveg"],
    specialties: ["Oftalmologie"],
  },
  {
    id: "ent",
    icon: "👂",
    level: "normal",
    labels: { ro: "Durere în gât, urechi, sinuzită", en: "Sore throat, ear pain, sinusitis", hu: "Torokfájás, fülfájás, arcüreg-gyulladás" },
    keywords: ["gat", "ureche", "sinuzita", "nas", "amigdale", "throat", "ear", "sinus", "nose", "torok", "ful", "orr"],
    specialties: ["ORL"],
  },
  {
    id: "urinary",
    icon: "🚻",
    level: "normal",
    labels: { ro: "Probleme urinare, rinichi", en: "Urinary or kidney problems", hu: "Vizelési vagy vesepanaszok" },
    keywords: ["urinare", "rinichi", "vezica", "prostata", "urine", "kidney", "bladder", "prostate", "vizeles", "vese", "holyag"],
    specialties: ["Urologie", "Nefrologie / Dializă"],
  },
  {
    id: "hormones",
    icon: "⚖️",
    level: "normal",
    labels: { ro: "Tiroidă, greutate, glicemie / diabet", en: "Thyroid, weight, blood sugar / diabetes", hu: "Pajzsmirigy, testsúly, vércukor / cukorbetegség" },
    keywords: ["tiroida", "diabet", "glicemie", "zahar", "slabit", "ingrasat", "thyroid", "diabetes", "sugar", "weight", "pajzsmirigy", "cukor", "suly"],
    specialties: ["Endocrinologie", "Diabet, nutriție și boli metabolice"],
  },
  {
    id: "allergy",
    icon: "🌼",
    level: "normal",
    labels: { ro: "Alergii (strănut, urticarie)", en: "Allergies (sneezing, hives)", hu: "Allergia (tüsszögés, csalánkiütés)" },
    keywords: ["alergie", "polen", "stranut", "urticarie", "allergy", "pollen", "sneez", "hives", "allergia", "tusszoges"],
    specialties: ["Alergologie"],
  },
  {
    id: "women",
    icon: "🤰",
    level: "normal",
    labels: { ro: "Sarcină sau probleme ginecologice", en: "Pregnancy or gynaecological problems", hu: "Terhesség vagy nőgyógyászati panaszok" },
    keywords: ["sarcina", "gravida", "ginecolog", "menstruatie", "pregnan", "gynaec", "gynec", "period", "terhes", "nogyogyasz", "menstruacio"],
    specialties: ["Obstetrică-Ginecologie", "Reproducere umană asistată"],
  },
  {
    id: "child",
    icon: "🧸",
    level: "normal",
    labels: { ro: "Copilul e bolnav / control pediatric", en: "Sick child / child check-up", hu: "Beteg gyermek / gyermekorvosi vizsgálat" },
    keywords: ["copil", "pediatru", "bebelus", "vaccin", "child", "kid", "pediatric", "vaccine", "gyerek", "gyermekorvos", "oltas"],
    specialties: ["Pediatrie", "Neonatologie", "Neurologie pediatrică"],
  },
  {
    id: "mental",
    icon: "💬",
    level: "normal",
    labels: { ro: "Anxietate, depresie, stres, insomnie", en: "Anxiety, depression, stress, insomnia", hu: "Szorongás, depresszió, stressz, álmatlanság" },
    keywords: ["anxietate", "depresie", "stres", "somn", "panica", "anxiety", "depression", "stress", "sleep", "panic", "szorongas", "depresszio", "alvas"],
    specialties: ["Psihologie / Psihoterapie", "Psihiatrie"],
  },
  {
    id: "speech",
    icon: "🗣️",
    level: "normal",
    labels: { ro: "Copilul vorbește greu / bâlbâială", en: "Speech delay / stuttering", hu: "Beszédfejlődési késés / dadogás" },
    keywords: ["vorbire", "balbaiala", "logoped", "speech", "stutter", "beszed", "dadogas", "logopedus"],
    specialties: ["Logopedie"],
  },
  {
    id: "veins",
    icon: "🦶",
    level: "normal",
    labels: { ro: "Varice, picioare umflate", en: "Varicose veins, swollen legs", hu: "Visszér, dagadt láb" },
    keywords: ["varice", "vene", "picioare umflate", "varicose", "veins", "swollen legs", "visszer", "labdagadas"],
    specialties: ["Chirurgie vasculară"],
  },
  {
    id: "tests",
    icon: "🧪",
    level: "normal",
    labels: { ro: "Analize de sânge, control general", en: "Blood tests, general check-up", hu: "Vérvétel, általános kivizsgálás" },
    keywords: ["analize", "sange", "recoltare", "control", "blood test", "check-up", "checkup", "verveteli", "labor", "kivizsgalas"],
    specialties: ["Laborator analize medicale", "Medicina familiei"],
  },
  {
    id: "scan",
    icon: "🧲",
    level: "normal",
    labels: { ro: "RMN, radiografie, ecografie", en: "MRI, X-ray, scan", hu: "MRI, röntgen, ultrahang" },
    keywords: ["rmn", "ct", "radiografie", "ecografie", "mri", "x-ray", "scan", "rontgen", "ultrahang"],
    specialties: ["Imagistică (RMN, radiologie)"],
  },
  {
    id: "teeth",
    icon: "😁",
    level: "normal",
    labels: { ro: "Detartraj, aparat dentar, implant", en: "Teeth cleaning, braces, implants", hu: "Fogkő-eltávolítás, fogszabályzó, implantátum" },
    keywords: ["detartraj", "aparat dentar", "implant", "dentist", "braces", "cleaning", "fogszabalyzo", "fogko", "fogorvos"],
    specialties: ["Stomatologie", "Ortodonție", "Implantologie", "Stomatologie pediatrică"],
  },
];
