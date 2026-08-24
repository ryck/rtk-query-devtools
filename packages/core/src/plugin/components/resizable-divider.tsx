import clsx from "clsx";
import { useEffect, useState } from "react";
import type { RtkQueryDevtoolsClasses } from "../theme";

const KEYBOARD_STEP = 16;

export interface ResizableDividerProps {
  classes: RtkQueryDevtoolsClasses;
  /**
   * Positive widens the detail panel (regardless of which physical direction
   * the pointer/key moved to cause it); negative narrows it. See
   * `useDetailPanelWidth.resizeBy`.
   */
  onResize: (deltaPx: number) => void;
  onReset: () => void;
}

/**
 * A vertical drag handle between a row list and its detail panel. Sits to
 * the *left* of the detail panel, so growing the panel means moving this
 * handle left — every caller passes deltas already normalized to "positive
 * widens the detail panel" (see `useDetailPanelWidth`), so this component
 * only has to negate the raw pointer delta once.
 */
export function ResizableDivider({ classes, onResize, onReset }: ResizableDividerProps) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: PointerEvent) {
      // The handle is left of the panel it resizes: moving the pointer left
      // (negative movementX) should widen it, so the sign flips here once.
      onResize(-e.movementX);
    }
    function handleUp() {
      setDragging(false);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, onResize]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize detail panel (double-click to reset, arrow keys to adjust)"
      tabIndex={0}
      className="rtkq:group rtkq:relative rtkq:w-2 rtkq:shrink-0 rtkq:cursor-col-resize rtkq:touch-none rtkq:select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          onResize(KEYBOARD_STEP);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          onResize(-KEYBOARD_STEP);
        } else if (e.key === "Home" || e.key === "Enter") {
          e.preventDefault();
          onReset();
        }
      }}
    >
      <div
        className={clsx(
          "rtkq:absolute rtkq:inset-y-0 rtkq:left-1/2 rtkq:-translate-x-1/2 rtkq:border-l",
          classes.border,
        )}
      />
      <div
        className={clsx(
          "rtkq:absolute rtkq:inset-y-0 rtkq:left-1/2 rtkq:w-1 rtkq:-translate-x-1/2 rtkq:rounded-full rtkq:opacity-0 rtkq:transition-opacity rtkq:group-hover:opacity-100",
          classes.polling,
          dragging && "rtkq:opacity-100",
        )}
      />
    </div>
  );
}
