/**
 * Encrypts a Uint8Array or File using AES-GCM with the provided key.
 * @param input - The data to encrypt (Uint8Array or File)
 * @param key - 32-byte Uint8Array key
 * @returns Promise<Uint8Array> - IV (12 bytes) + encrypted data
 */
export async function encryptFile(input: Uint8Array | File, key: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'encrypt'
  ])
  let data: ArrayBuffer
  if (input instanceof File) {
    data = await input.arrayBuffer()
  } else {
    data = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
  }
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data)
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  return result
}

/**
 * Decrypts a Uint8Array encrypted with encryptFile using AES-GCM and the provided key.
 * @param encrypted - The encrypted data (IV + ciphertext)
 * @param key - 32-byte Uint8Array key
 * @returns Promise<Uint8Array> - Decrypted data
 */
export async function decryptFile(encrypted: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const iv = encrypted.slice(0, 12)
  const data = encrypted.slice(12)
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'decrypt'
  ])
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data)
  return new Uint8Array(decrypted)
}
