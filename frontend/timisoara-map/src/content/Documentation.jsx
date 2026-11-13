// =============================================================
//  DOCUMENTATION TEXT (shown when you click the "i" button)
//  Write your own text here. It works like HTML:
//    <h3>Heading</h3>
//    <p>A paragraph.</p>
//    <ul><li>A list item</li></ul>
//    <a href="https://...">A link</a>
//    <strong>bold</strong>, <em>italic</em>
//  Everything must stay between the <div className="docs"> and </div>.
// =============================================================

export default function Documentation() {
  return (
    <div className="docs">
      <h3>Ce este TimiCareNow?</h3>
      <p>
        TimiCareNow te ajută să găsești rapid spitale, clinici, farmacii și alte
        unități medicale din Timișoara, direct pe hartă.
      </p>

      <h3>Cum se folosește</h3>
      <ul>
        <li>Scrie ce cauți pe pagina de start sau în lupa de pe hartă (de exemplu „farmacie non-stop”).</li>
        <li>Folosește filtrele din stânga pentru tip, zonă și servicii.</li>
        <li>Apasă pe un punct de pe hartă pentru telefon, program și descriere.</li>
        <li>Fiecare locație are un scor (media recenziilor, din 5 stele). Deschide „Recenzii și detalii” pentru a le citi.</li>
        <li>Intră în cont pentru a salva locațiile preferate și pentru a scrie recenzii.</li>
      </ul>

      <h3>Despre date</h3>
      <p>
        Harta conține 100 de clinici, spitale, laboratoare și cabinete din Timișoara.
        Datele (adresă, telefon, program, specialități, medici) au fost adunate din
        site-urile oficiale ale clinicilor, paginile rețelelor medicale, ROmedic și
        OpenStreetMap. O locație apare doar dacă o sursă a confirmat numele, adresa,
        telefonul, programul și cel puțin o specialitate. Sursele fiecărei locații
        sunt afișate în fereastra „Recenzii și detalii”.
      </p>
      <p>
        Scorul combină evaluările publice (ROmedic, SfatulMedicului) cu recenziile
        scrise pe TimiCareNow. Programul se poate schimba: confirmă telefonic înainte
        de vizită. În caz de urgență, sună la 112.
      </p>

      <h3>Echipa</h3>
      <p>Proiect realizat de echipa TimiCareNow la Unihack.</p>
    </div>
  );
}
