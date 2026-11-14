import { useEffect, useRef, useState } from "react";
import { IconUpload, IconX } from "@tabler/icons-react";
import { accountApi } from "../account/api.js";
import { TEXT } from "../config/texts.js";
import DocumentList, { DOCUMENT_CATEGORIES, formatSize } from "./DocumentList.jsx";
import "./panels.css";
import "./documents.css";

// "My medical documents" on the account page (patients): upload medical
// letters, MRI / CT / X-ray images, lab results... Stored in the
// medical_documents table (backend/routes/documents.js); doctors see them
// only for patients who booked at their clinic.

// Browsers often leave file.type empty for .dcm / .heic / .docx, so the
// extension decides. Must match MIME_TYPES in backend/routes/documents.js.
const TYPES_BY_EXTENSION = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  heif: "image/heif",
  dcm: "application/dicom",
  dicom: "application/dicom",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
  txt: "text/plain",
};
const ACCEPT = Object.keys(TYPES_BY_EXTENSION).map((e) => `.${e}`).join(",");

const typeOf = (file) => TYPES_BY_EXTENSION[file.name.split(".").pop().toLowerCase()] ?? null;
const titleOf = (file) => file.name.replace(/\.[^.]+$/, "") || file.name;
const today = () => new Date().toISOString().slice(0, 10);

export default function MedicalDocuments() {
  const [data, setData] = useState(null); // { documents, usage }
  const [loadError, setLoadError] = useState(false);
  const [files, setFiles] = useState([]); // chosen, not uploaded yet
  const [category, setCategory] = useState("letter");
  const [date, setDate] = useState("");
  const [progress, setProgress] = useState(null); // { done, total } while uploading
  const [message, setMessage] = useState(null); // { ok, text }
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);

  const reload = () => accountApi.getDocuments().then(setData);

  useEffect(() => {
    let cancelled = false;
    accountApi.getDocuments().then(
      (d) => !cancelled && setData(d),
      () => !cancelled && setLoadError(true)
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) return <p className="login-error">{TEXT.profileLoadError}</p>;
  if (!data) return null;

  const { documents, usage } = data;

  function choose(list) {
    const problems = [];
    const ok = [];
    for (const file of list) {
      if (!typeOf(file)) problems.push(TEXT.documentsBadType(file.name));
      else if (file.size > usage.maxFileBytes) problems.push(TEXT.documentsTooBig(file.name, formatSize(usage.maxFileBytes)));
      else if (file.size === 0) problems.push(TEXT.documentsBadType(file.name));
      else ok.push(file);
    }
    setFiles((prev) => [...prev, ...ok]);
    setMessage(problems.length ? { ok: false, text: problems.join(" ") } : null);
  }

  async function upload(e) {
    e.preventDefault();
    if (files.length === 0) return;
    setMessage(null);
    const failed = [];
    let lastError = null;
    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      try {
        await accountApi.uploadDocument(files[i], typeOf(files[i]), { category, date, title: titleOf(files[i]) });
      } catch (err) {
        failed.push(files[i]);
        lastError = err;
      }
    }
    setProgress(null);
    setFiles(failed);
    await reload().catch(() => {});
    if (failed.length === 0) {
      setDate("");
      setMessage({ ok: true, text: TEXT.documentsUploaded });
    } else {
      // 400/413/415/429 come with a message meant for the user
      const reason = lastError?.status && lastError.status < 500 ? lastError.message : TEXT.documentsUploadError;
      setMessage({ ok: false, text: `${failed.map((f) => f.name).join(", ")}: ${reason}` });
    }
  }

  async function remove(doc) {
    if (!window.confirm(TEXT.documentsDeleteConfirm(doc.title))) return;
    try {
      await accountApi.deleteDocument(doc.id);
      await reload();
    } catch {
      setMessage({ ok: false, text: TEXT.profileSaveError });
    }
  }

  const uploading = progress !== null;

  return (
    <>
      <h3>{TEXT.documentsTitle}</h3>
      <form className="login-form account-form docs-upload" onSubmit={upload}>
        <div
          className={`docs-drop${dragging ? " dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            choose([...e.dataTransfer.files]);
          }}
        >
          <IconUpload size={26} stroke={1.6} aria-hidden="true" />
          <button type="button" className="btn-link" onClick={() => input.current?.click()} disabled={uploading}>
            {TEXT.documentsChoose}
          </button>
          <small>{TEXT.documentsFormats(formatSize(usage.maxFileBytes))}</small>
          <input
            ref={input}
            type="file"
            multiple
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              choose([...e.target.files]);
              e.target.value = ""; // the same file can be chosen again
            }}
          />
        </div>

        {files.length > 0 && (
          <>
            <ul className="docs-pending">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  <span>{f.name}</span>
                  <small>{formatSize(f.size)}</small>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      title={TEXT.documentsRemoveFile}
                    >
                      <IconX size={16} aria-hidden="true" />
                      <span className="sr-only">{TEXT.documentsRemoveFile}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="book-row">
              <label>
                {TEXT.documentsCategory}
                <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={uploading}>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {TEXT.documentCategory[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {TEXT.documentsDate}
                <input type="date" value={date} max={today()} min="1900-01-01" onChange={(e) => setDate(e.target.value)} disabled={uploading} />
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? TEXT.documentsUploading(progress.done + 1, progress.total) : TEXT.documentsUpload(files.length)}
            </button>
          </>
        )}

        {message && <p className={message.ok ? "login-notice" : "login-error"}>{message.text}</p>}
        <p className="login-note account-note">
          {TEXT.documentsWhy} {TEXT.documentsUsage(formatSize(usage.bytes), formatSize(usage.maxBytes))}
        </p>
      </form>

      {documents.length === 0 ? (
        <p className="saved-empty">{TEXT.documentsEmpty}</p>
      ) : (
        <DocumentList documents={documents} loadFile={(d) => accountApi.getDocumentFile(d.id)} onDelete={remove} />
      )}
    </>
  );
}
