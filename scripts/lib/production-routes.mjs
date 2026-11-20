// Local preview shortcuts must stay unavailable in production. The homepage
// journey remains public at /#journey; /journey is development-only.
export const DEVELOPMENT_ONLY_ROUTES = new Set(["/journey"]);
