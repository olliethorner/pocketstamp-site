import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export default function ExpandableImagePreview({ src, alt, dialogLabel, width, height }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const dialogRef = useRef(null);
  const previewButtonRef = useRef(null);
  const generatedId = useId();
  const dialogId = `image-preview-${generatedId.replace(/:/g, "")}`;

  useEffect(() => {
    if (!isPreviewOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previewButton = previewButtonRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button")?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previewButton?.focus();
    };
  }, [isPreviewOpen]);

  return (
    <div className="ps-dashboard-preview-wrap">
      <button
        ref={previewButtonRef}
        type="button"
        className="ps-dashboard-preview"
        aria-label={`Open full-screen ${dialogLabel}`}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={() => setIsPreviewOpen(true)}
        style={{ "--ps-preview-aspect": `${width} / ${height}` }}
      >
        <span className="ps-dashboard-browser-bar" aria-hidden="true">
          <span /><span /><span />
        </span>
        <span className="ps-dashboard-preview-image">
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="ps-dashboard-expand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
          </svg>
        </span>
      </button>

      {typeof document !== "undefined" ? createPortal(
        <AnimatePresence>
          {isPreviewOpen ? (
            <motion.div
              className="ps-dashboard-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsPreviewOpen(false);
              }}
            >
              <motion.div
                id={dialogId}
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={dialogLabel}
                className="ps-dashboard-lightbox-dialog"
                style={{ "--ps-preview-native-width": `${width}px` }}
                initial={{ opacity: 0, scale: 0.965, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.975, y: 8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  className="ps-dashboard-lightbox-close"
                  aria-label={`Close ${dialogLabel}`}
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
                <div className="ps-dashboard-lightbox-image">
                  <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    decoding="async"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      ) : null}
    </div>
  );
}
