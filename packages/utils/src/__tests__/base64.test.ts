import { base64urlEncode, base64urlDecode } from '../base64'

describe('base64urlEncode', () => {
  it('encodes a string to base64url', () => {
    expect(base64urlEncode('hello')).toBe('aGVsbG8')
    expect(base64urlEncode('foo/bar+baz=')).toBe('Zm9vL2JhcitiYXo9')
  })
})

describe('base64urlDecode', () => {
  it('decodes a base64url string', () => {
    expect(base64urlDecode('aGVsbG8')).toBe('hello')
    expect(base64urlDecode('Zm9vL2JhcitiYXo9')).toBe('foo/bar+baz=')
  })
})
