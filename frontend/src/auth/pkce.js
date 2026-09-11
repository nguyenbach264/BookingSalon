/**
 * Web Crypto PKCE Helpers (RFC 7636)
 * Su dung Web Crypto API chuan cua trinh duyet (khong can thu vien ngoai)
 */

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Sinh chuoi code_verifier ngau nhien (64 bytes an toan)
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(64);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Sinh code_challenge tu code_verifier bang SHA-256
 */
export async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

/**
 * Sinh chuoi state ngau nhien chong CSRF
 */
export function generateState() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}