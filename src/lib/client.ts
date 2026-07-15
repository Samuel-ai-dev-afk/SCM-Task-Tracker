// Small typed fetch helpers for the browser.

async function parse(res: Response) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || "Request failed. Try again.");
  }
  return data;
}

export const api = {
  get: (url: string) => fetch(url, { cache: "no-store" }).then(parse),
  post: (url: string, body: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(parse),
  patch: (url: string, body: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(parse),
  del: (url: string) => fetch(url, { method: "DELETE" }).then(parse),
};
