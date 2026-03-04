// Custom Pages Router 404 — intentionally avoids next/head and all hooks
// so the bundle doesn't pull in head.js (which calls useContext) and fails
// during static prerender on Windows due to the case-insensitive fs path issue.
export default function Custom404() {
  return null;
}
