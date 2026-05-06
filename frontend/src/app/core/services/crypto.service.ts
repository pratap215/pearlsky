import { Injectable } from '@angular/core';

// 32-byte key for AES-GCM
const KEY_MATERIAL = 'PearlSky-Search-Key-2026!@#$%^&*(';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private key: CryptoKey | null = null;

  private async getKey(): Promise<CryptoKey> {
    if (this.key) return this.key;
    const enc = new TextEncoder();
    const raw = enc.encode(KEY_MATERIAL).slice(0, 32);
    this.key = await crypto.subtle.importKey(
      'raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
    );
    return this.key;
  }

  async encrypt(data: object): Promise<string> {
    try {
      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data))
      );
      const combined = new Uint8Array(12 + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), 12);
      return btoa(String.fromCharCode(...combined))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return btoa(JSON.stringify(data));
    }
  }

  async decrypt<T = object>(token: string): Promise<T | null> {
    try {
      const key = await this.getKey();
      const norm = token.replace(/-/g, '+').replace(/_/g, '/');
      const padded = norm + '=='.slice((norm.length + 3) % 4 || 4);
      const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
      const dec = new TextDecoder();
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12)
      );
      return JSON.parse(dec.decode(decrypted)) as T;
    } catch {
      try { return JSON.parse(atob(token)) as T; } catch { return null; }
    }
  }
}
