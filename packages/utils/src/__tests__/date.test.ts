import { formatDate } from '../date'

describe('formatDate', () => {
  it('formats a Date object to a locale string', () => {
    const date = new Date('2023-01-01T12:00:00Z')
    expect(
      formatDate(date, 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    ).toMatch(/01\/01\/2023|2023-01-01/)
  })

  it('formats a date string to a locale string', () => {
    expect(formatDate('2023-01-01T12:00:00Z', 'en-US', { year: 'numeric' })).toMatch(/2023/)
  })
})
