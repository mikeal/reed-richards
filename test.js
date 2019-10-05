const { test } = require('tap')
const { collection, counter, quarter } = require('./')

test('basic collection', t => {
  t.plan(1)
  const c = counter('first', 'second', 'third')
  const data = { first: 'one', second: 'two', third: 3 }
  c.count(data)
  const row = Array.from(c.rows())
  t.same(row, [['one', 'two', 3, 1]])
})

test('basic counts', t => {
  t.plan(1)
  const c = counter('first', 'second', 'third')
  const data = { first: 'one', second: 'two', third: 3 }
  c.count(data)
  c.count(data)
  c.count(data)
  data.second = 'test'
  c.count(data)
  const row = Array.from(c.rows())
  t.same(row, [['one', 'two', 3, 3], ['one', 'test', 3, 1]])
})

test('basic unique', t => {
  t.plan(1)
  const c = counter('first', 'second', 'third')
  const data = { first: 'one', second: 'two', third: 3 }
  c.count(data)
  c.count(data)
  data.third = 'test'
  c.count(data)
  data.second = 'foo'
  c.count(data)
  const row = Array.from(c.unique())
  const expected = [
    { first: 'one', second: 'two', third: 2 },
    { first: 'one', second: 'foo', third: 1 }
  ]
  t.same(row, expected)
})

test('error on undefined', t => {
  t.plan(4)
  let c = counter('first', 'second')
  try {
    c.count({})
  } catch (e) {
    t.same(e.message, 'This row does not have a property: first')
  }
  try {
    c.count({ first: 'asdf' })
  } catch (e) {
    t.same(e.message, 'This row does not have a property: second')
  }
  c = collection('first', 'second')
  try {
    c.set({})
  } catch (e) {
    t.same(e.message, 'This row does not have a property: first')
  }
  try {
    c.set({ first: 'asdf' })
  } catch (e) {
    t.same(e.message, 'This row does not have a property: second')
  }
})

test('object iteration', t => {
  t.plan(1)
  const c = counter('first', 'second', 'third')
  const data = { first: 'one', second: 'two', third: 3 }
  c.count(data)
  c.count(data)
  data.third = 'test'
  c.count(data)
  data.second = 'foo'
  c.count(data)
  const rows = Array.from(c.objects())
  t.same(rows, [
    { first: 'one', second: 'two', third: 3, count: 2 },
    { first: 'one', second: 'two', third: 'test', count: 1 },
    { first: 'one', second: 'foo', third: 'test', count: 1 }
  ])
})

test('object iteration w/ index', t => {
  t.plan(1)
  const c = counter('first', 'second', 'third')
  c.index('last', data => 'bar')
  const data = { first: 'one', second: 'two', third: 3 }
  c.count(data)
  c.count(data)
  data.third = 'test'
  c.count(data)
  data.second = 'foo'
  c.count(data)
  const rows = Array.from(c.objects())
  t.same(rows, [
    { first: 'one', second: 'two', third: 3, last: 'bar', count: 2 },
    { first: 'one', second: 'two', third: 'test', last: 'bar', count: 1 },
    { first: 'one', second: 'foo', third: 'test', last: 'bar', count: 1 }
  ])
})

test('reduce', t => {
  t.plan(7)
  const c = collection('quarter', 'lang', 'count')
  c.set({ quarter: 'q1', lang: 'ruby', count: 1000 })
  c.set({ quarter: 'q1', lang: 'ruby', count: 2000 })
  c.set({ quarter: 'q1', lang: 'js', count: 1000 })
  c.set({ quarter: 'q2', lang: 'ruby', count: 3000 })
  c.set({ quarter: 'q2', lang: 'js', count: 2000 })

  const red = (prev, data) => {
    if (prev) t.ok(data.count - prev === 1000)
    t.ok(data)
    return data.count
  }
  const rows = Array.from(c.reduce(red))
  t.same(rows, [2000, 1000, 3000, 2000])
})

test('quarter', t => {
  t.plan(4)
  t.same(quarter(new Date('2018-01-02')), '2018 Q1')
  t.same(quarter(new Date('2018-04-02')), '2018 Q2')
  t.same(quarter(new Date('2018-08-02')), '2018 Q3')
  t.same(quarter(new Date('2018-12-02')), '2018 Q4')
})

test('empty', t => {
  t.plan(1)
  const c = collection('asdf')
  t.same(Array.from(c.unique()), [])
})
