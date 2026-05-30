/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates a standard RFC4122 version 4 UUID.
 * Safely falls back if crypto.randomUUID is not supported by the environment 
 * (e.g. non-secure contexts, older browsers, or restricted iframe sandboxes).
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Continue to fallback if call fails under restrictive policies
    }
  }

  // Fallback 1: Use crypto.getRandomValues if supported
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Set version to 4 (UUIDv4)
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // Set variant to RFC4122
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      
      const hex: string[] = [];
      for (let i = 0; i < 16; i++) {
        hex.push(bytes[i].toString(16).padStart(2, "0"));
      }
      return [
        hex.slice(0, 4).join(""),
        hex.slice(4, 6).join(""),
        hex.slice(6, 8).join(""),
        hex.slice(8, 10).join(""),
        hex.slice(10, 16).join("")
      ].join("-");
    } catch {
      // Continue to Math.random fallback
    }
  }

  // Fallback 2: Math.random (standard clean representation)
  let d = new Date().getTime();
  let d2 = (typeof performance !== "undefined" && performance.now && performance.now() * 1000) || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
