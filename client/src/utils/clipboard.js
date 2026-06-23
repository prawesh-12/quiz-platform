// Copy text to the clipboard, returning whether it succeeded.
//
// navigator.clipboard only exists in a secure context (HTTPS or localhost), so on a
// plain-HTTP deployment (e.g. http://<elastic-ip>) it is unavailable. Fall back to the
// legacy execCommand("copy") path, which works over HTTP in most browsers.
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path (e.g. permission denied / insecure context).
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
