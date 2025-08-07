import * as providers from '../index'

describe('providers index', () => {
  it('should export UserProvider and useUser', () => {
    expect(providers.UserProvider).toBeDefined()
    expect(providers.useUser).toBeDefined()
  })

  it('should export WorkspaceProvider and useWorkspace', () => {
    expect(providers.WorkspaceProvider).toBeDefined()
    expect(providers.useWorkspace).toBeDefined()
  })

  it('should export InviteProvider and useInvites', () => {
    expect(providers.InviteProvider).toBeDefined()
    expect(providers.useInvites).toBeDefined()
  })

  it('should export getServerUser', () => {
    expect(providers.getServerUser).toBeDefined()
  })

  it('should export PERSONAL_WORKSPACE_ID', () => {
    expect(providers.PERSONAL_WORKSPACE_ID).toBeDefined()
    expect(providers.PERSONAL_WORKSPACE_ID).toBe('personal')
  })

  it('should export all expected items', () => {
    const expectedExports = [
      'UserProvider',
      'useUser',
      'WorkspaceProvider',
      'useWorkspace',
      'InviteProvider',
      'useInvites',
      'getServerUser',
      'PERSONAL_WORKSPACE_ID'
    ]

    expectedExports.forEach((exportName) => {
      expect(providers[exportName as keyof typeof providers]).toBeDefined()
    })
  })
})
