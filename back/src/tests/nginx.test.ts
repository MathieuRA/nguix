import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getNginxHealth } from '../services/nginx.ts'

test('nginx not installed', () => {
    const result = getNginxHealth(() => { throw new Error('not found') })
    assert.deepEqual(result, { installed: false })
})

test('nginx installed and running', () => {
    const result = getNginxHealth(() => {})
    assert.deepEqual(result, { installed: true, active: true })
})

test('nginx installed but stopped', () => {
    let callCount = 0
    const result = getNginxHealth(() => {
        if (++callCount === 2) throw new Error('inactive')
    })
    assert.deepEqual(result, { installed: true, active: false })
})
