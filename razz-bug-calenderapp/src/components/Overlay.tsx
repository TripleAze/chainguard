import React, { useRef, useEffect, useState } from "react";
import { useNoteContext } from "../context/NoteContext";

interface OverlayProps {
  dateKey: string;
  position: { top: number; left: number; width: number };
  align: "left" | "right" | "center";
  onClose: () => void;
}

const Overlay: React.FC<OverlayProps> = ({
  dateKey,
  position,
  align,
  onClose,
}) => {
  const { notes, setNote } = useNoteContext();
  const [value, setValue] = useState(notes[dateKey] || "");

  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLTextAreaElement | null>(null);
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    firstFocusableRef.current?.focus();
  }, []);

  useEffect(() => {
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const first = firstFocusableRef.current;
        const last = lastFocusableRef.current;

        if (!first || !last) return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab forward
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // this update local state if note changes
  useEffect(() => {
    setValue(notes[dateKey] || "");
  }, [dateKey, notes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const overlayWidth = 200;

  const calculatedLeft =
    align === "center"
      ? position.left + position.width / 2 - overlayWidth / 2
      : align === "left"
      ? position.left + position.width - overlayWidth
      : position.left;

  return (
    <div
      className={`overlay ${
        align === "left"
          ? "align-left"
          : align === "right"
          ? "align-right"
          : "align-center"
      }`}
      ref={overlayRef}
      aria-modal="true"
      aria-labelledby={`overlay-title-${dateKey}`}
      style={{
        position: "absolute",
        top: position.top,
        left: calculatedLeft,
        zIndex: 1000,
        width: overlayWidth,
      }}
    >
      <strong id={`overlay-title-${dateKey}`}>{dateKey}</strong>
      <textarea
        ref={firstFocusableRef}
        value={value}
        maxLength={100}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter note..."
        aria-label="Note text"
        style={{
          marginTop: "0.5rem",
          width: "100%",
          height: "60px",
          resize: "none",
          borderRadius: "4px",
          padding: "0.4rem",
          border: "1px solid #ccc",
        }}
      />
      <div
        style={{
          marginTop: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          style={{
            padding: "6px 12px",
            backgroundColor: "#e2e8f0",
            border: "1px solid #cbd5e0",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => onClose()}
        >
          Close
        </button>
        <button
          ref={lastFocusableRef}
          style={{
            padding: "6px 12px",
            backgroundColor: "#3182ce",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => {
            setNote(dateKey, value.trim());
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Overlay;
