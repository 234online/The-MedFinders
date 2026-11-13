import { useEffect, useRef, useState } from "react";
import "./SearchBar.css";
import { TEXT } from "./config/texts.js";

// ICON: replace the file public/search-icon.svg with your own
// (same name), or change this path to point at your file,
// e.g. "/my-icon.png". Files in the public folder are served from "/".
const ICON_SRC = "/search-icon.svg";

export default function SearchBar({ value, onChange, placeholder = TEXT.searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  // Focus the text field as soon as the bar opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    onChange("");
    setOpen(false);
  }

  return (
    <div className={"searchbar" + (open ? " open" : "")}>
      <button
        type="button"
        className="searchbar-icon"
        aria-label={TEXT.searchButton}
        onClick={() => (open ? inputRef.current?.focus() : setOpen(true))}
      >
        <img src={ICON_SRC} alt="" />
      </button>

      {open && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && close()}
            // Collapse back into a button if you click away with nothing typed
            onBlur={() => !value && setOpen(false)}
          />
          <button
            type="button"
            className="searchbar-close"
            aria-label={TEXT.clearSearch}
            onMouseDown={(e) => e.preventDefault()}
            onClick={close}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}
