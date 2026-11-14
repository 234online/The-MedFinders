// Line icons (Tabler icons, https://tabler.io/icons) used instead of emoji.
// All icons share one drawing style and take the colour of the text
// around them, so they look consistent on every phone and computer.
//
// To change an icon: pick a new one on tabler.io/icons, import it
// below, and put it in the right list.
import {
  IconStethoscope,
  IconHeartbeat,
  IconBabyCarriage,
  IconBrain,
  IconDental,
  IconRibbonHealth,
  IconMicroscope,
  IconBuildingHospital,
  IconBuilding,
  IconSchool,
  IconFlask,
  IconScan,
  IconNurse,
  IconMedicalCross,
  IconMapPin,
  IconActivity,
  IconBandage,
  IconBone,
  IconBottle,
  IconBug,
  IconDroplet,
  IconEar,
  IconEye,
  IconFaceMask,
  IconFlower,
  IconGenderFemale,
  IconHeartBroken,
  IconLifebuoy,
  IconLungs,
  IconMessages,
  IconMoodSad,
  IconMoodKid,
  IconMoodSick,
  IconApple,
  IconTemperature,
  IconTestPipe,
  IconUserExclamation,
  IconVirus,
  IconWalk,
} from "@tabler/icons-react";
import { renderToStaticMarkup } from "react-dom/server";

// ---------- Our own icons (Tabler doesn't have these) ----------
// Drawn on the same 24x24 grid with round line ends, so they match.
function makeIcon(drawing) {
  return function CustomIcon({ size = 24, stroke = 2, ...rest }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {drawing}
      </svg>
    );
  };
}

// Scalpel: thin handle + blade with a straight back, curved edge and sharp tip
const IconScalpel = makeIcon(
  <g transform="rotate(-40 12 12)">
    <path d="M2.5 11.2h9.5v1.8h-9.5a.9 .9 0 0 1 0 -1.8z" />
    <path d="M13.5 10.4h8.5c-.9 3 -4.5 4.6 -8.5 3.8z" />
  </g>
);

// Face with a big smile that shows the teeth
const IconSmileTeeth = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9.5v.5" />
    <path d="M15 9.5v.5" />
    <path d="M7.5 13h9a4.5 4.5 0 0 1 -9 0z" />
    <path d="M8.2 15h7.6" />
    <path d="M10.5 13v2" />
    <path d="M13.5 13v2" />
  </>
);

// Kidneys: two beans facing each other, joined by the ureters
const IconKidneys = makeIcon(
  <>
    <path d="M8 4.5c-3.5 0 -5 3 -5 6s1.5 5.5 4.5 5.5c2 0 2.5 -1.5 1.7 -3c-.7 -1.4 -.7 -3.4 .1 -4.8c.9 -1.6 .5 -3.7 -1.3 -3.7z" />
    <path d="M16 4.5c3.5 0 5 3 5 6s-1.5 5.5 -4.5 5.5c-2 0 -2.5 -1.5 -1.7 -3c.7 -1.4 .7 -3.4 -.1 -4.8c-.9 -1.6 -.5 -3.7 1.3 -3.7z" />
    <path d="M8.9 10.6c2.1 .6 3.1 2.4 3.1 5.4v4" />
    <path d="M15.1 10.6c-2.1 .6 -3.1 2.4 -3.1 5.4" />
  </>
);

// Glucose meter (diabetes): device with a screen, test strip and a blood drop
const IconGlucoseMeter = makeIcon(
  <>
    <rect x="5.5" y="9" width="11" height="12.5" rx="2.5" />
    <rect x="7.75" y="11.25" width="6.5" height="3.75" rx="1" />
    <path d="M11 18.5v.01" />
    <path d="M9.75 9v-4.5h2.5v4.5" />
    <path d="M18.5 2.5c1.1 1.5 1.75 2.5 1.75 3.3a1.75 1.75 0 0 1 -3.5 0c0 -.8 .65 -1.8 1.75 -3.3z" />
  </>
);

// Thyroid (endocrinology): the butterfly-shaped gland in front of the windpipe
const IconThyroid = makeIcon(
  <>
    <path d="M10.4 14.2c0 -4.5 -1.1 -9.7 -2.2 -9.7c-1.5 0 -3.7 5.6 -3.7 9.5c0 3.4 1.5 5.5 3.5 5.5c1.6 0 2.3 -1.5 2.4 -2.8" />
    <path d="M13.6 14.2c0 -4.5 1.1 -9.7 2.2 -9.7c1.5 0 3.7 5.6 3.7 9.5c0 3.4 -1.5 5.5 -3.5 5.5c-1.6 0 -2.3 -1.5 -2.4 -2.8" />
    <path d="M10.4 14.2h3.2" />
    <path d="M10.4 16.7h3.2" />
    <path d="M12 2.5v11.7" />
    <path d="M12 16.7v4.8" />
  </>
);

// Medical domains (SPECIALTY_GROUPS in placeTypes.js), by their Romanian name
const GROUP_ICONS = {
  "Medicină generală": IconStethoscope,
  "Specialități medicale": IconHeartbeat,
  "Chirurgie": IconScalpel,
  "Îngrijire pediatrică": IconBabyCarriage,
  "Sănătatea femeii": IconGenderFemale,
  "Sănătate mintală": IconBrain,
  "Stomatologie": IconDental,
  "Oncologie": IconRibbonHealth,
  "Analize și recuperare": IconMicroscope,
};

// Types of places (CATEGORIES in placeTypes.js), by id
const CATEGORY_ICONS = {
  hospital: IconBuildingHospital,
  polyclinic: IconBuilding,
  clinic: IconStethoscope,
  "university clinic": IconSchool,
  dental: IconDental,
  laboratory: IconFlask,
  imaging: IconScan,
  practice: IconNurse,
};

export function GroupIcon({ id, size = 26 }) {
  const Icon = GROUP_ICONS[id] ?? IconMedicalCross;
  return <Icon size={size} stroke={1.6} aria-hidden="true" />;
}

export function CategoryIcon({ id, size = 26 }) {
  const Icon = CATEGORY_ICONS[id] ?? IconMapPin;
  return <Icon size={size} stroke={1.6} aria-hidden="true" />;
}

// Symptoms in the "Ce te doare?" guide (SYMPTOMS in symptoms.js), by id
const SYMPTOM_ICONS = {
  "chest-pain": IconHeartBroken,
  "breathing": IconLungs,
  "stroke": IconBrain,
  "unconscious": IconUserExclamation,
  "bleeding": IconDroplet,
  "anaphylaxis": IconBug,
  "self-harm": IconLifebuoy,
  "child-fever": IconTemperature,
  "injury": IconBone,
  "toothache": IconDental,
  "cold-flu": IconVirus,
  "cough": IconFaceMask,
  "heart": IconHeartbeat,
  "skin": IconBottle,
  "stomach": IconMoodSick,
  "head": IconBandage,
  "joints": IconWalk,
  "eyes": IconEye,
  "ent": IconEar,
  "urinary": IconKidneys,
  "diabetes": IconGlucoseMeter,
  "endocrine": IconThyroid,
  "nutrition": IconApple,
  "allergy": IconFlower,
  "women": IconGenderFemale,
  "child": IconMoodKid,
  "mental": IconMoodSad,
  "speech": IconMessages,
  "veins": IconActivity,
  "tests": IconTestPipe,
  "scan": IconScan,
  "teeth": IconSmileTeeth,
};

export function SymptomIcon({ id, size = 22 }) {
  const Icon = SYMPTOM_ICONS[id] ?? IconMedicalCross;
  return <Icon size={size} stroke={1.7} aria-hidden="true" />;
}

// The same icon as plain HTML text, for map pins (Leaflet needs HTML, not React)
export function categoryIconHtml(id, size) {
  return renderToStaticMarkup(<CategoryIcon id={id} size={size} />);
}

// The TimiCareNow logo mark
export function LogoIcon({ size = 22 }) {
  return <IconMedicalCross size={size} stroke={1.8} aria-hidden="true" />;
}
