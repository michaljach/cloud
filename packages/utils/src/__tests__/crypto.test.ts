import { encryptFile, decryptFile } from '../crypto'

describe('encryptFile and decryptFile', () => {
  it('should encrypt and decrypt a Uint8Array (mocked)', async () => {
    // Mock crypto.subtle and getRandomValues
    const key = new Uint8Array(32).fill(1)
    const data = new Uint8Array([1, 2, 3, 4, 5])
    globalThis.crypto = {
      getRandomValues: (arr: Uint8Array) => {
        arr.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        return arr
      },
      subtle: {
        importKey: async () => ({}),
        encrypt: async () => new Uint8Array([10, 20, 30, 40, 50]).buffer,
        decrypt: async () => new Uint8Array([1, 2, 3, 4, 5]).buffer
      }
    } as any
    const encrypted = await encryptFile(data, key)
    expect(encrypted).toBeInstanceOf(Uint8Array)
    const decrypted = await decryptFile(encrypted, key)
    expect(decrypted).toBeInstanceOf(Uint8Array)
    expect(Array.from(decrypted)).toEqual([1, 2, 3, 4, 5])
  })
})
