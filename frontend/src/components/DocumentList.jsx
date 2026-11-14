import { useMemo, useState } from "react";
import { IconDownload, IconEye, IconFile, IconFileText, IconPhoto, IconScan, IconTrash } from "@tabler/icons-react";
import { TEXT, getLanguage } from "../config/texts.js";
import "./documents.css";

// =============================================================
//  List of a patient's medical documents. Used on "My account"
//  (MedicalDocuments.jsx, with delete) and in the doctor dashboard
//  (doctor/PatientRecord.jsx, read-only).
//    documents   [{ id, category, title, fileName, mimeType, size, date, createdAt }]
//    loadFile    (doc) => Promise<Blob>
//    onDelete    (doc) => void   optional
// =============================================================

export const DOCUMENT_CATEGORIES = ["letter", "lab", "xray", "mri", "ct", "ultrasound", "prescription", "other"];

// Types the browser can show in a tab; the rest (DICOM, Word, HEIC, TIFF) are downloaded
const VIEWABLE = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp", "text/plain"]);

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ mimeType }) {
  const props = { size: 22, stroke: 1.6, "aria-hidden": true };
  if (mimeType === "application/dicom") return <IconScan {...props} />;
  if (mimeType.startsWith("image/")) return <IconPhoto {...props} />;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return <IconFileText {...props} />;
  return <IconFile {...props} />;
}

function saveBlob(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function DocumentList({ documents, loadFile, onDelete }) {
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(false);

  const present = useMemo(
    () => DOCUMENT_CATEGORIES.filter((c) => documents.some((d) => d.category === c)),
    [documents]
  );
  const shown = filter === "all" ? documents : documents.filter((d) => d.category === filter);
  const dateFormat = new Intl.DateTimeFormat(getLanguage(), { dateStyle: "medium" });

  async function open(doc, download) {
    const view = !download && VIEWABLE.has(doc.mimeType);
    // Open the tab now, while the click still counts: after the download
    // finishes the browser would treat it as a popup and block it.
    const tab = view ? window.open("", "_blank") : null;
    setBusyId(doc.id);
    setError(false);
    try {
      const url = URL.createObjectURL(await loadFile(doc));
      if (tab) tab.location.href = url;
      else saveBlob(url, doc.fileName);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab?.close();
      setError(true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="docs">
      {present.length > 1 && (
        <div className="docs-filter" role="group" aria-label={TEXT.documentsCategory}>
          {["all", ...present].map((c) => (
            <button
              key={c}
              type="button"
              className={filter === c ? "active" : ""}
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {c === "all" ? TEXT.documentsAll : TEXT.documentCategory[c]}
            </button>
          ))}
        </div>
      )}

      {error && <p className="login-error">{TEXT.documentsOpenError}</p>}

      <ul className="docs-list">
        {shown.map((d) => (
          <li key={d.id}>
            <span className="docs-icon">
              <FileIcon mimeType={d.mimeType} />
            </span>
            <span className="docs-info">
              <strong title={d.fileName}>{d.title}</strong>
              <small>
                <span className="docs-tag">{TEXT.documentCategory[d.category] ?? d.category}</span>
                {dateFormat.format(new Date(`${d.date ?? d.createdAt.slice(0, 10)}T00:00:00`))} · {formatSize(d.size)}
              </small>
            </span>
            <span className="docs-actions">
              {VIEWABLE.has(d.mimeType) && (
                <button type="button" onClick={() => open(d, false)} disabled={busyId === d.id} title={TEXT.documentsOpen}>
                  <IconEye size={18} stroke={1.8} aria-hidden="true" />
                  <span className="sr-only">{TEXT.documentsOpen}</span>
                </button>
              )}
              <button type="button" onClick={() => open(d, true)} disabled={busyId === d.id} title={TEXT.documentsDownload}>
                <IconDownload size={18} stroke={1.8} aria-hidden="true" />
                <span className="sr-only">{TEXT.documentsDownload}</span>
              </button>
              {onDelete && (
                <button type="button" className="danger" onClick={() => onDelete(d)} title={TEXT.documentsDelete}>
                  <IconTrash size={18} stroke={1.8} aria-hidden="true" />
                  <span className="sr-only">{TEXT.documentsDelete}</span>
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
