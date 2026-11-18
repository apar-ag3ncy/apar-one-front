import "server-only";

// One server-rendered definition per icon. Path data stays out of client bundles.
export function IconSprite() {
  return <svg width="0" height="0" aria-hidden="true" focusable="false"
    style={{ position: "absolute", overflow: "hidden" }}>
    <defs>
      <symbol id="apar-ui-arrow-up-right" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10" /></symbol>
      <symbol id="apar-ui-arrow-down-right" viewBox="0 0 24 24"><path d="m7 7 10 10M7 17h10V7" /></symbol>
      <symbol id="apar-ui-arrow-down-left" viewBox="0 0 24 24"><path d="M17 7 7 17M7 7v10h10" /></symbol>
      <symbol id="apar-ui-arrow-right" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7" /></symbol>
      <symbol id="apar-ui-arrow-left" viewBox="0 0 24 24"><path d="M20 12H4m7-7-7 7 7 7" /></symbol>
      <symbol id="apar-ui-arrow-down" viewBox="0 0 24 24"><path d="M12 4v16m-7-7 7 7 7-7" /></symbol>
      <symbol id="apar-ui-arrow-up" viewBox="0 0 24 24"><path d="M12 20V4m-7 7 7-7 7 7" /></symbol>
      <symbol id="apar-ui-arrow-left-right" viewBox="0 0 24 24"><path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4" /></symbol>
      <symbol id="apar-ui-rotate-ccw" viewBox="0 0 24 24"><path d="M3 10a9 9 0 1 1 2.8 8M3 4v6h6" /></symbol>
      <symbol id="apar-ui-corner-up-left" viewBox="0 0 24 24"><path d="m9 14-5-5 5-5M4 9h10a6 6 0 0 1 6 6v5" /></symbol>
      <symbol id="apar-ui-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></symbol>
      <symbol id="apar-ui-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></symbol>
      <symbol id="apar-ui-zap" viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" /></symbol>
      <symbol id="apar-ui-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6" /></symbol>
      <symbol id="apar-ui-menu" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16" /></symbol>
      <symbol id="apar-ui-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
      <symbol id="apar-ui-star" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6.3-.9L12 3Z" /></symbol>
      <symbol id="apar-ui-grid" viewBox="0 0 24 24"><path d="M4 4h5v5H4ZM15 4h5v5h-5ZM4 15h5v5H4ZM15 15h5v5h-5Z" /></symbol>
    </defs>
  </svg>;
}
