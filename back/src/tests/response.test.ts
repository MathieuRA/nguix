import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiResponse } from '../classes/response.ts'

test('defaults to status 200', () => {
    const res = new ApiResponse()
    assert.equal(res.statusCode, 200)
})

test('uses provided status code', () => {
    const res = new ApiResponse({ status: 404 })
    assert.equal(res.statusCode, 404)
})

test('body is undefined when no data provided', () => {
    const res = new ApiResponse()
    assert.equal(res.body, undefined)
})

test('body returns provided data', () => {
    const data = { items: [1, 2, 3] }
    const res = new ApiResponse({ data })
    assert.deepEqual(res.body, data)
})
