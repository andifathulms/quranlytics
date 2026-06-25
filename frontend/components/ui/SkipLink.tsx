// First focusable element on the page — lets keyboard users jump past the nav.
export function SkipLink() {
  return (
    <a href="#main" className="skip-link">
      Skip to content
    </a>
  );
}
