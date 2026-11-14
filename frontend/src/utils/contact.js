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

// WhatsApp needs the international number without "+": "0742 107 777" -> "40742107777".
// Only Romanian mobile numbers (07xx xxx xxx) are returned: landlines can't use WhatsApp.
export function whatsappNumber(tel) {
  let digits = String(tel).replace(/\D/g, "");
  if (digits.startsWith("40")) digits = "0" + digits.slice(2);
  return /^07\d{8}$/.test(digits) ? "40" + digits.slice(1) : null;
}

export function whatsappLink(tel, message) {
  const number = whatsappNumber(tel);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export function mailtoLink(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
