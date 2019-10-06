# Counters

You initialize a counter with the ordered column keys of your data.

If you try to count data that is missing any of these values the counter
will throw.

## counter(...columns)

Function accepts a order list of column names. If you attempt
to `set()` a row w/o one of the required columns it will throw.

```javascript
const { collection, counter, quarter } = require('./')

const c = counter('first', 'second', 'third')
const data = { first: 'one', second: 'two', third: 3 }
c.count(data)
const rows = Array.from(c.rows())
rows === [['one', 'two', 3, 1]])
```

### counter.rows()

Returns a generator that yields an array for every line
in the counter.

```javascript
const c = counter('first', 'second', 'third')
const data = { first: 'one', second: 'two', third: 3 }
c.count(data)
c.count(data)
c.count(data)
data.second = 'test'
c.count(data)
const row = Array.from(c.rows())
row === [['one', 'two', 3, 3], ['one', 'test', 3, 1]])
```

### counter.unique()

Returns a generator of objects the gives the counts of
unique keys rather than the counter values.

```javascript
const c = counter('first', 'second', 'third')
const data = { first: 'one', second: 'two', third: 3 }
c.count(data)
c.count(data)
data.third = 'test'
c.count(data)
data.second = 'foo'
c.count(data)
const row = Array.from(c.unique())
row === [
  { first: 'one', second: 'two', third: 2 },
  { first: 'one', second: 'foo', third: 1 }
]
```

### counter.objects()

A generator that yields objects for every row in
the counter.

```javascript
const c = counter('first', 'second', 'third')
const data = { first: 'one', second: 'two', third: 3 }
c.count(data)
c.count(data)
data.third = 'test'
c.count(data)
data.second = 'foo'
c.count(data)
const rows = Array.from(c.objects())
rows === [
  { first: 'one', second: 'two', third: 3, count: 2 },
  { first: 'one', second: 'two', third: 'test', count: 1 },
  { first: 'one', second: 'foo', third: 'test', count: 1 }
]
```

## collection(...columns)

Function accepts a order list of column names. If you attempt
to `set()` a row w/o one of the required columns it will throw.

### collection.reduce()

```javascript
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
```

# quarter()

Accepts a datetime object and returns a string for the
year and quarter the time falls under.

```javascript
assert.equal(quarter(new Date('2018-01-02')), '2018 Q1')
assert.equal(quarter(new Date('2018-04-02')), '2018 Q2')
assert.equal(quarter(new Date('2018-08-02')), '2018 Q3')
assert.equal(quarter(new Date('2018-12-02')), '2018 Q4')
```

