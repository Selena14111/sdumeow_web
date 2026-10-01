import { describe, expect, it } from 'vitest'

import { normalizeCat, normalizeCatStatus } from '@/api/adapters/cats'

describe('cat adapter', () => {
  it.each([
    [0, '在校'],
    [1, '毕业'],
    [2, '喵星'],
    [3, '住院'],
    [4, '领养交接中'],
    ['0', '在校'],
    ['ADOPTION_HANDOVER', '领养交接中'],
  ])('normalizes cat status %s to %s', (rawStatus, expected) => {
    expect(normalizeCatStatus(rawStatus)).toBe(expected)
  })

  it('keeps numeric zero status instead of falling back to unknown text', () => {
    expect(normalizeCat({ id: 'cat-1', name: 'Mimi', status: 0 }).status).toBe('在校')
  })
})
