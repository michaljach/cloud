export async function encryptFile(file: File, key: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'encrypt'
  ])
  const fileBuffer = await file.arrayBuffer()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, fileBuffer)
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  return result
}

export async function decryptFile(encrypted: Uint8Array, key: Uint8Array): Promise<string> {
  const iv = encrypted.slice(0, 12)
  const data = encrypted.slice(12)
  const cryptoKey = await window.crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'decrypt'
  ])
  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data)
  return new TextDecoder().decode(decrypted)
}
