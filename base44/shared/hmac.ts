// Constant-time HMAC SHA-256 verification shared by the webhook receivers.
// Both the Ring and Amazon adapters authenticate webhook bodies with this.

export async function verifyHmac(secret: string, body: string, signature: string): Promise<boolean> {
  if (!secret || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const provided = String(signature).trim().toLowerCase().replace(/^sha256=/, '');
  if (provided.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i += 1) diff |= hex.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}