import { TEXT } from "../config/texts.js";
import { specialtyName } from "../config/placeTypes.js";
import { splitPhones, whatsappLink, mailtoLink } from "../utils/contact.js";
import { trackContact } from "../account/api.js";
import { IconPhone, IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import "./ContactActions.css";

// Call / WhatsApp / appointment-by-email buttons for one place.
//   specialty  optional Romanian specialty name to mention in the message
//              (e.g. the one the user filtered for)
//   user       logged-in user (their name/email go into the email), or null
//   compact    smaller layout for the map popup
export default function ContactActions({ place, specialty = null, user = null, compact = false }) {
  const phones = splitPhones(place.phone);
  const specialtyText = specialty ? specialtyName(specialty) : null;
  const message = TEXT.whatsappMessage({ clinic: place.name, specialty: specialtyText });

  const mail = place.email
    ? mailtoLink(
        place.email,
        TEXT.appointmentSubject(place.name),
        TEXT.appointmentBody({
          clinic: place.name,
          specialty: specialtyText,
          name: user?.name,
          email: user?.email,
        })
      )
    : null;

  if (phones.length === 0 && !mail) return null;

  return (
    <div className={"contact-actions" + (compact ? " compact" : "")}>
      {phones.map((p) => {
        const wa = whatsappLink(p.tel, message);
        return (
          <div key={p.label} className="contact-phone">
            <a
              className="contact-btn call"
              href={`tel:${p.tel}`}
              onClick={() => trackContact(place.id, "call", p.label)}
              title={`${TEXT.callButton} ${p.label}`}>
              <IconPhone size={16} stroke={1.8} aria-hidden="true" />
              <span className="contact-number">{p.label}</span>
            </a>
            {wa && (
              <a
                className="contact-btn whatsapp"
                href={wa}
                onClick={() => trackContact(place.id, "whatsapp", p.label)}
                target="_blank"
                rel="noreferrer"
                title={`${TEXT.whatsappButton} ${p.label}`}
              >
                <IconBrandWhatsapp size={16} stroke={1.8} aria-hidden="true" />
                {TEXT.whatsappButton}
              </a>
            )}
          </div>
        );
      })}

      {mail && (
        <a
          className="contact-btn appointment"
          href={mail}
          onClick={() => trackContact(place.id, "email", place.email)}
          title={TEXT.appointmentHint}>
          <IconMail size={16} stroke={1.8} aria-hidden="true" />
          {TEXT.appointmentButton}
        </a>
      )}
    </div>
  );
}
