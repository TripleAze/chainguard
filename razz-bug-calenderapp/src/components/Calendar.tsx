import React, { useEffect, useRef, useState } from "react";
import Month from "./Month";
import "../styles/Calender.scss";
import Overlay from "./Overlay";

const Calendar: React.FC = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const currentMonthDate = new Date(currentYear, currentMonth, 1);
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

  const [overlayDate, setOverlayDate] = useState<string | null>(null);
  const [overlayPos, setOverlayPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const [overlayAlign, setOverlayAlign] = useState<"left" | "right" | "center">(
    "center"
  );
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const clickedButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON" && target.classList.contains("day")) {
        const date = target.getAttribute("data-date");
        if (!date) return;

        const rect = target.getBoundingClientRect();
        const cell = target.closest("td");
        if (!cell) return;
        const row = cell.parentElement;
        if (!row) return;

        const allCells = Array.from(row.children);
        const colIndex = allCells.indexOf(cell);

        if (screenWidth <= 768) {
          setOverlayAlign("center");
        } else if (colIndex <= 2) {
          setOverlayAlign("right");
        } else if (colIndex >= 4) {
          setOverlayAlign("left");
        } else {
          setOverlayAlign("center");
        }

        (clickedButtonRef.current as HTMLElement | null)?.focus();
        clickedButtonRef.current = target;

        setOverlayDate(date);
        setOverlayPos({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [screenWidth]);

  return (
    <div className="calendar">
      <Month date={prevMonthDate} highlightToday={false} />
      <Month date={currentMonthDate} highlightToday={true} />
      <Month date={nextMonthDate} highlightToday={false} />
      {overlayDate && (
        <Overlay
          dateKey={overlayDate}
          position={overlayPos}
          align={overlayAlign}
          onClose={() => {
            setOverlayDate(null);
            setTimeout(() => {
              clickedButtonRef.current?.focus();
            }, 0);
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
