// Ask the browser's password manager to save or update a credential.
//
// Chrome only reliably offers to save a password when a real form is submitted
// and the page navigates. This app signs in over fetch and changes passwords in
// a modal, so neither happens — the Credential Management API lets us ask the
// browser directly instead. Unsupported browsers (Firefox, Safari) simply do
// nothing; the correct autocomplete attributes on the inputs cover those.

export async function rememberPassword(
  email: string,
  password: string,
  name?: string
): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const Ctor = (window as unknown as { PasswordCredential?: new (data: unknown) => unknown })
      .PasswordCredential;
    if (!Ctor || !navigator.credentials?.store) return;

    const credential = new Ctor({ id: email, password, name: name || email });
    await navigator.credentials.store(credential as Credential);
  } catch {
    // The user declined, or the browser refused. Never block the flow for this.
  }
}
