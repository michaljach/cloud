type User = { id: number; name: string }

let users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]

export function getUsers(): User[] {
  return users
}

export function getUserById(id: number): User | undefined {
  return users.find((u) => u.id === id)
}

export function createUser(name: string): User {
  const newUser = { id: users.length + 1, name }
  users.push(newUser)
  return newUser
}

export function updateUser(id: number, name?: string): User | undefined {
  const user = users.find((u) => u.id === id)
  if (!user) return undefined
  if (name) user.name = name
  return user
}

export function deleteUser(id: number): boolean {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) return false
  users.splice(index, 1)
  return true
}
