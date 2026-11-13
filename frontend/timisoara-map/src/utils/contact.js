// Phone field can hold several numbers: "0256 203 303 / 0256 201 976",
// "0742 107 777 (Kids), 0743 057 777 (Teens)", "021 9268, 0372 249 182"
// -> [{ label, tel }]
export function splitPhones(phone) {
  if (!phone) return [];
  return phone
    .split(/\s*[/,]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => ({ label, tel: label.replace(/\(.*?\)/g, "").replace(/[^\d+]/g, "") }))
    .filter((p) => p.tel.length >= 4);
}

// "https://www.medlife.ro/clinica-x" -> "medlife.ro"
export function shortUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
