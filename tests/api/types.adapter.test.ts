import { describe, expect, it } from 'vitest'

import { normalizeDynamicTypeOptions } from '@/api/adapters/types'

describe('dynamic type adapter', () => {
  it('normalizes symptom items with tag and description fields', () => {
    expect(
      normalizeDynamicTypeOptions([
        { id: 1, tag: '外伤', description: '身体有明显外伤或伤口' },
        { id: 2, tag: '流血', description: '身体有出血现象' },
      ]),
    ).toEqual([
      { value: 1, label: '外伤', description: '身体有明显外伤或伤口' },
      { value: 2, label: '流血', description: '身体有出血现象' },
    ])
  })
})
