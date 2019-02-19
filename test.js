const { test } = require('tap')
const { collection } = require('./')

test('basic collection', t => {
  t.plan(1)
  let c = collection('first', 'second', 'third')
  let data = { first: 'one', second: 'two', third: 3 }
  c.add(data)
  let row = Array.from(c.rows())
  t.same(row, [ [ 'one', 'two', 3, 1 ] ])
})

test('basic counts', t => {
  t.plan(1)
  let c = collection('first', 'second', 'third')
  let data = { first: 'one', second: 'two', third: 3 }
  c.add(data)
  c.add(data)
  c.add(data)
  data.second = 'test'
  c.add(data)
  let row = Array.from(c.rows())
  t.same(row, [ [ 'one', 'two', 3, 3 ], ['one', 'test', 3, 1] ])
})

test('basic unique', t => {
  t.plan(1)
  let c = collection('first', 'second', 'third')
  let data = { first: 'one', second: 'two', third: 3 }
  c.add(data)
  c.add(data)
  data.third = 'test'
  c.add(data)
  data.second = 'foo'
  c.add(data)
  let row = Array.from(c.unique())
  t.same(row, [ [ 'one', 'two', 2 ], ['one', 'foo', 1] ])
})

test('error on undefined', t => {
  t.plan(2)
  let c = collection('first', 'second')
  try {
    c.add({})
  } catch (e) {
    t.same(e.message, 'This row does not have a property: first')
  }
  try {
    c.add({ 'first': 'asdf' })
  } catch (e) {
    t.same(e.message, 'This row does not have a property: second')
  }
})

test('object iteration', t => {
  t.plan(1)
  let c = collection('first', 'second', 'third')
  let data = { first: 'one', second: 'two', third: 3 }
  c.add(data)
  c.add(data)
  data.third = 'test'
  c.add(data)
  data.second = 'foo'
  c.add(data)
  let rows = Array.from(c.objects())
  t.same(rows, [
    { first: 'one', second: 'two', third: 3, count: 2 },
    { first: 'one', second: 'two', third: 'test', count: 1 },
    { first: 'one', second: 'foo', third: 'test', count: 1 }
  ])
})

test('object iteration w/ index', t => {
  t.plan(1)
  let c = collection('first', 'second', 'third')
  c.index('last', data => 'bar')
  let data = { first: 'one', second: 'two', third: 3 }
  c.add(data)
  c.add(data)
  data.third = 'test'
  c.add(data)
  data.second = 'foo'
  c.add(data)
  let rows = Array.from(c.objects())
  t.same(rows, [
    { first: 'one', second: 'two', third: 3, last: 'bar', count: 2 },
    { first: 'one', second: 'two', third: 'test', last: 'bar', count: 1 },
    { first: 'one', second: 'foo', third: 'test', last: 'bar', count: 1 }
  ])
})
