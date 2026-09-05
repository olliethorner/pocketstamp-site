import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Menu, X } from "lucide-react";
import { SALES_EMAIL } from "../contactEmails.js";
import { demoHref, demoJoinUrl } from "./marketingContent.js";

export function Brand() {
  return (
    <a className="mk-brand" href="/" aria-label="PocketStamp home">
      <span className="mk-brand-mark" aria-hidden="true">
        P<span />
      </span>
      PocketStamp
    </a>
  );
}

export function Button({
  href,
  children,
  secondary = false,
  arrow = false,
  ...props
}) {
  return (
    <a
      href={href}
      className={`mk-button${secondary ? " mk-button-secondary" : ""}`}
      {...props}
    >
      {children}
      {arrow && <ArrowUpRight size={17} aria-hidden="true" />}
    </a>
  );
}

export function SectionHeading({ eyebrow, title, children, centered = false }) {
  return (
    <div className={`mk-section-heading${centered ? " mk-centered" : ""}`}>
      <p className="mk-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children && <div className="mk-lede">{children}</div>}
    </div>
  );
}

export function CheckList({ items }) {
  return (
    <ul className="mk-check-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={15} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const links = [
  ["#how-it-works", "How it works"],
  ["#system", "Product"],
  ["#retention", "Retention"],
  ["#pilot", "Café pilot"],
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const dialog = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("a")?.focus();
    function close() {
      setOpen(false);
      trigger.current?.focus();
    }
    function onKey(event) {
      if (event.key === "Escape") close();
      if (event.key !== "Tab") return;
      const elements = [...dialog.current.querySelectorAll("a, button")];
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const media = window.matchMedia("(min-width: 960px)");
    function onResize(event) {
      if (event.matches) close();
    }
    media.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onResize);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <>
      <a href="#main-content" className="mk-skip">
        Skip to content
      </a>
      <header className="mk-header">
        <nav className="mk-container mk-nav" aria-label="Primary navigation">
          <Brand />
          <div className="mk-nav-links">
            {links.map(([href, label]) => (
              <a href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
          <div className="mk-nav-actions">
            <a className="mk-login" href="/merchant">
              Merchant login
            </a>
            <Button href={demoHref} arrow>
              Book a demo
            </Button>
            <button
              className="mk-menu-toggle"
              type="button"
              ref={trigger}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="marketing-menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>
      {open && (
        <div
          className="mk-mobile-menu"
          id="marketing-menu"
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="mk-mobile-menu-top">
            <Brand />
            <button
              type="button"
              className="mk-menu-toggle"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {links.map(([href, label]) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label}
                <ArrowUpRight size={20} />
              </a>
            ))}
            <a href="/merchant">
              Merchant login
              <ArrowUpRight size={20} />
            </a>
            <a href="/download">
              Scanner App
              <ArrowUpRight size={20} />
            </a>
          </nav>
          <Button href={demoHref} arrow onClick={closeMenu}>
            Book a demo
          </Button>
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-main">
          <div>
            <Brand />
            <p>Wallet loyalty for independent cafés.</p>
          </div>
          <div>
            <a href="/contact">Contact</a>
            <a href={demoJoinUrl}>Try the demo card</a>
            <a href="/merchant">Merchant login</a>
            <a href="/download">PocketStamp Scanner · Android Download</a>
          </div>
          <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
        </div>
        <div className="mk-footer-bottom">
          <span>© {new Date().getFullYear()} PocketStamp.</span>
          <span>Apple Wallet + Google Wallet. No customer app.</span>
        </div>
      </div>
    </footer>
  );
}
