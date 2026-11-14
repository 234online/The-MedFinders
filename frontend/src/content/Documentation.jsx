import { getLanguage } from "../config/texts.js";

// =============================================================
//  DOCUMENTATION TEXT (shown when you click the "i" button)
//  One version per language below (ro, en, hu). It works like HTML:
//    <h3>Heading</h3>   <p>A paragraph.</p>   <ul><li>List item</li></ul>
//    <a href="https://...">A link</a>   <strong>bold</strong>
// =============================================================

function Romanian() {
  return (
    <>
      <h3>Ce este MedFinders?</h3>
      <p>
        MedFinders te ajută să găsești rapid spitale, clinici, laboratoare și cabinete
        medicale din Timișoara, direct pe hartă.
      </p>

      <h3>Cum se folosește</h3>
      <ul>
        <li>Nu știi la ce medic să mergi? Apasă „Ce te doare?” și alege simptomul.</li>
        <li>Scrie ce cauți pe pagina de start sau în lupa de pe hartă (specialitate, clinică, medic).</li>
        <li>Folosește filtrele din stânga: specialități, tip unitate, program și servicii.</li>
        <li>Apasă pe un punct de pe hartă pentru telefon, program, medici și evaluări.</li>
        <li>Intră în cont pentru a salva locațiile preferate și a scrie recenzii.</li>
      </ul>

      <h3>Despre date</h3>
      <p>
        Harta conține 100 de clinici, spitale, laboratoare și cabinete din Timișoara. Datele
        au fost adunate din site-urile oficiale ale clinicilor, paginile rețelelor medicale,
        ROmedic și OpenStreetMap. O locație apare doar dacă o sursă a confirmat numele,
        adresa, telefonul, programul și cel puțin o specialitate.
      </p>
      <p>
        Scorul combină evaluările publice (ROmedic, SfatulMedicului) cu recenziile scrise pe
        MedFinders. Ghidul „Ce te doare?” te orientează, dar nu înlocuiește un diagnostic.
        Confirmă programul telefonic înainte de vizită. În caz de urgență, sună la 112.
      </p>

      <h3>Echipa</h3>
      <p>Proiect realizat de echipa MedFinders la Unihack.</p>
    </>
  );
}

function English() {
  return (
    <>
      <h3>What is MedFinders?</h3>
      <p>
        MedFinders helps you quickly find hospitals, clinics, laboratories and medical
        practices in Timișoara, right on the map.
      </p>

      <h3>How to use it</h3>
      <ul>
        <li>Not sure which doctor to see? Press “What's wrong?” and pick your symptom.</li>
        <li>Type what you're looking for on the start page or in the map's search (specialty, clinic, doctor).</li>
        <li>Use the filters on the left: specialties, type of place, opening hours and services.</li>
        <li>Click a point on the map for the phone number, opening hours, doctors and ratings.</li>
        <li>Log in to save your favourite places and write reviews.</li>
      </ul>

      <h3>About the data</h3>
      <p>
        The map lists 100 clinics, hospitals, laboratories and practices in Timișoara. The
        data comes from the clinics' official websites, medical network pages, ROmedic and
        OpenStreetMap. A place is listed only if a source confirmed its name, address, phone
        number, opening hours and at least one specialty.
      </p>
      <p>
        The score combines public ratings (ROmedic, SfatulMedicului) with reviews written on
        MedFinders. The “What's wrong?” guide points you in the right direction but is not a
        diagnosis. Confirm opening hours by phone before visiting. In an emergency, call 112.
      </p>

      <h3>Team</h3>
      <p>Built by the MedFinders team at Unihack.</p>
    </>
  );
}

function Hungarian() {
  return (
    <>
      <h3>Mi a MedFinders?</h3>
      <p>
        A MedFinders segít gyorsan megtalálni Temesvár kórházait, klinikáit,
        laboratóriumait és orvosi rendelőit, közvetlenül a térképen.
      </p>

      <h3>Használat</h3>
      <ul>
        <li>Nem tudod, melyik orvoshoz fordulj? Nyomd meg a „Mi a panaszod?” gombot, és válaszd ki a tünetet.</li>
        <li>Írd be, mit keresel a kezdőlapon vagy a térkép keresőjében (szakterület, klinika, orvos).</li>
        <li>Használd a bal oldali szűrőket: szakterületek, intézmény típusa, nyitvatartás és szolgáltatások.</li>
        <li>Kattints egy pontra a térképen a telefonszámért, nyitvatartásért, orvosokért és értékelésekért.</li>
        <li>Jelentkezz be a kedvenc helyek mentéséhez és véleményíráshoz.</li>
      </ul>

      <h3>Az adatokról</h3>
      <p>
        A térképen Temesvár 100 klinikája, kórháza, laboratóriuma és rendelője szerepel. Az
        adatok a klinikák hivatalos oldalairól, orvosi hálózatok oldalairól, a ROmedicről és
        az OpenStreetMapről származnak. Egy hely csak akkor szerepel, ha egy forrás megerősítette
        a nevét, címét, telefonszámát, nyitvatartását és legalább egy szakterületét.
      </p>
      <p>
        A pontszám a nyilvános értékeléseket (ROmedic, SfatulMedicului) és a MedFinders-n írt
        véleményeket egyesíti. A „Mi a panaszod?” útmutató eligazít, de nem helyettesíti a
        diagnózist. Látogatás előtt telefonon erősítsd meg a nyitvatartást. Vészhelyzetben hívd
        a 112-t.
      </p>

      <h3>Csapat</h3>
      <p>A MedFinders csapat projektje az Unihack versenyen.</p>
    </>
  );
}

const VERSIONS = { ro: Romanian, en: English, hu: Hungarian };

export default function Documentation() {
  const Version = VERSIONS[getLanguage()] ?? Romanian;
  return (
    <div className="docs">
      <Version />
    </div>
  );
}
