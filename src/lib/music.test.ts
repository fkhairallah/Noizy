import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  SCALE,
  harmonyIndex,
  keyPosition,
  noteIndexForKey,
  noteIndexForPoint,
  printableKey,
} from './music.ts'

test('the scale climbs and has one note per garden cell', () => {
  assert.equal(SCALE.length, 9)
  for (let i = 1; i < SCALE.length; i += 1) {
    assert.ok(SCALE[i]! > SCALE[i - 1]!)
  }
})

test('points on the screen map into the scale, low left to high right', () => {
  const low = noteIndexForPoint(8, 390, 300, 400)
  const high = noteIndexForPoint(290, 8, 300, 400)
  assert.equal(low, 0)
  assert.equal(high, 8)
  for (const x of [0, 150, 299, 300]) {
    for (const y of [0, 200, 399, 400]) {
      const index = noteIndexForPoint(x, y, 300, 400)
      assert.ok(index >= 0 && index < SCALE.length)
    }
  }
})

test('each key keeps a stable note and a nearby harmony', () => {
  assert.equal(noteIndexForKey('KeyL'), noteIndexForKey('KeyL'))
  const played = ['', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyL', 'Digit1', 'ArrowLeft', 'Space'].map(
    (code) => noteIndexForKey(code),
  )
  assert.ok(played.every((index) => index >= 0 && index < SCALE.length))
  assert.ok(new Set(played).size > 1)
  for (let index = 0; index < SCALE.length; index += 1) {
    const harmony = harmonyIndex(index)
    assert.notEqual(harmony, index)
    assert.ok(harmony >= 0 && harmony < SCALE.length)
  }
})

test('key blooms stay on screen', () => {
  for (const size of [200, 800, 1440]) {
    for (let i = 0; i < 24; i += 1) {
      const point = keyPosition(i, size, Math.round(size * 0.75))
      assert.ok(point.x >= 0 && point.x <= size)
      assert.ok(point.y >= 0 && point.y <= Math.round(size * 0.75))
    }
  }
})

test('printable keys become letters and modifiers stay quiet', () => {
  assert.equal(printableKey('a'), 'A')
  assert.equal(printableKey('Shift'), null)
  assert.equal(printableKey(' '), null)
})
