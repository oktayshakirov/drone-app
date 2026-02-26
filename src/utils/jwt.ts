/**
 * Build and sign ES256 JWT for Apple WeatherKit REST API.
 * Uses @noble/curves (p256) and @noble/hashes (sha256) for signing — pure JS, works in Expo.
 */

import { p256 } from "@noble/curves/nist.js";

export interface WeatherKitJwtPayload {
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  origin?: string;
}

export function buildWeatherKitPayload(
  teamId: string,
  serviceId: string,
  keyId: string
): {
  header: { alg: "ES256"; kid: string; id: string };
  payload: WeatherKitJwtPayload;
} {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60;
  return {
    header: {
      alg: "ES256",
      kid: keyId,
      id: `${teamId}.${serviceId}`,
    },
    payload: {
      iss: teamId,
      sub: serviceId,
      iat: now,
      exp,
    },
  };
}

function base64UrlEncode(data: string | Uint8Array): string {
  const str =
    typeof data === "string"
      ? data
      : String.fromCharCode(...new Uint8Array(data));
  const base64 =
    typeof btoa !== "undefined"
      ? btoa(str)
      : (() => {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          let result = "";
          for (let i = 0; i < str.length; i += 3) {
            const a = str.charCodeAt(i);
            const b = str.charCodeAt(i + 1);
            const c = str.charCodeAt(i + 2);
            result += chars[a >> 2];
            result += chars[((a & 3) << 4) | (b >> 4)];
            result += b !== undefined ? chars[((b & 15) << 2) | (c >> 6)] : "=";
            result += c !== undefined ? chars[c & 63] : "=";
          }
          return result;
        })();
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Extract 32-byte P-256 private key from PKCS#8 PEM.
 * Apple .p8 keys are PKCS#8; the EC private key is in an OCTET STRING (0x04 0x20 [32 bytes] or 0x04 0x21 0x00 [32 bytes]).
 */
function privateKeyFromPkcs8Pem(pem: string): Uint8Array {
  const trimmed = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  if (!trimmed) throw new Error("Invalid PEM: no body");
  const binary = atob(trimmed);
  const der = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i);
  for (let i = 0; i < der.length - 34; i++) {
    if (der[i] === 0x04 && der[i + 1] === 0x20) {
      return der.slice(i + 2, i + 34);
    }
    if (der[i] === 0x04 && der[i + 1] === 0x21 && der[i + 2] === 0x00) {
      return der.slice(i + 3, i + 35);
    }
  }
  throw new Error("Could not find 32-byte private key in PKCS#8 PEM");
}

/**
 * Sign the JWT with ES256 (ECDSA P-256 + SHA-256) and return the full JWT string.
 */
export async function signWeatherKitJwt(
  teamId: string,
  serviceId: string,
  keyId: string,
  privateKeyPem: string
): Promise<string> {
  const { header, payload } = buildWeatherKitPayload(teamId, serviceId, keyId);
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const privateKey = privateKeyFromPkcs8Pem(privateKeyPem);
  const messageBytes = new TextEncoder().encode(signingInput);
  const sigBytes = p256.sign(messageBytes, privateKey);
  const sigB64 = base64UrlEncode(sigBytes);

  return `${signingInput}.${sigB64}`;
}
