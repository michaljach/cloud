import { PERSONAL_WORKSPACE_ID } from '../constants'

describe('constants', () => {
  describe('PERSONAL_WORKSPACE_ID', () => {
    it('should export the correct personal workspace ID', () => {
      expect(PERSONAL_WORKSPACE_ID).toBe('personal')
    })

    it('should be a string', () => {
      expect(typeof PERSONAL_WORKSPACE_ID).toBe('string')
    })

    it('should not be empty', () => {
      expect(PERSONAL_WORKSPACE_ID.length).toBeGreaterThan(0)
    })
  })
})
