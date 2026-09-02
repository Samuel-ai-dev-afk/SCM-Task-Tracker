/**
 * Returns the URL only if it is safe to put in an href, otherwise null.
 *
 * `z.string().url()` is a validity check, not a safety one: it happily accepts
 * `javascript:alert(1)`, `data:text/html,…` and `vbscript:…`, because those are
 * all well-formed URLs. Rendering one into an <a href> gives whoever typed it
 * script execution in the clicking user's session — which on this app means a
 * staff member could reach a manager's session.
 *
 * Only http and https can appear in a link. Checked here as well as in the
 * schema, so a row that predates the validation still can't be clicked.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
