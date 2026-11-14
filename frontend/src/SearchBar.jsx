import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import "./SearchBar.css";
import { TEXT } from "./config/texts.js";


export default function SearchBar({ value, onChange, placeholder = TEXT.searchPlaceholder }) {
  // Start open if there is already a search (e.g. typed on the start page)
  const [open, setOpen] = useState(Boolean(value));
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
        <IconSearch size={22} stroke={1.8} aria-hidden="true" />
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
