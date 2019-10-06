const getQuarter = dt => {
  dt = new Date(dt)
  let quarter = dt.getFullYear() + ' '
  const month = dt.getMonth()
  if (month < 3) {
    quarter += 'Q1'
  } else if (month < 6) {
    quarter += 'Q2'
  } else if (month < 9) {
    quarter += 'Q3'
  } else {
    quarter += 'Q4'
  }
  return quarter
}

const get = (data, key) => {
  key = key.split('.')
  while (key.length) {
    const k = key.shift()
    data = data[k]
  }
  return data
}

const fold = function * (row, data) {
  for (const [key, value] of data.entries()) {
    const _row = row.slice()
    _row.push(key)
    if (value instanceof Map) {
      yield * fold(_row, value)
    } else {
      yield _row.concat([value])
    }
  }
}

class Base {
  constructor (...args) {
    this.data = new Map()
    this.args = args
    this._indexes = {}
    this._indexData = {}
  }

  _writeIndexes (indexKey, data) {
    for (const key of Object.keys(this._indexes)) {
      const prev = this._indexData[key][indexKey]
      this._indexData[key][indexKey] = this._indexes[key](data, prev)
    }
  }

  lookup (indexKey, complexKey) {
    return this._indexData[indexKey][JSON.stringify(complexKey)]
  }

  objects () {
    const self = this
    const iter = function * () {
      for (const row of self.rows()) {
        yield self.rowToObject(row)
      }
    }
    return iter()
  }

  rows () {
    return fold([], this.data)
  }

  unique () {
    const self = this
    const toKey = value => JSON.stringify(value.slice(0, value.length - 2))
    const iter = function * () {
      const generator = self.rows()
      let { value, done } = generator.next()
      let key
      if (!done) {
        key = toKey(value)
        let i = 0
        while (!done) {
          const _key = toKey(value)
          if (key === _key) {
            i += 1
          } else {
            const row = self.rowToObject(JSON.parse(key).concat([i]))
            delete row.count
            yield row
            i = 1
            key = _key
          }
          const next = generator.next()
          value = next.value
          done = next.done
        }
        const row = self.rowToObject(JSON.parse(key).concat([i]))
        delete row.count
        yield row
      }
    }
    return iter()
  }

  index (key, fn) {
    this._indexes[key] = fn
    this._indexData[key] = {}
  }

  reduce (fn) {
    const self = this
    const prev = {}
    const iter = function * () {
      for (const key of self.data.keys()) {
        for (const row of fold([], self.data.get(key))) {
          const complexKey = [key].concat(row.slice(0, row.length - 1))
          const strKey = JSON.stringify(row.slice(0, row.length - 1))
          const data = self.rowToObject(row, self.args.slice(1), complexKey)
          const value = fn(prev[strKey], data, key)
          yield value
          prev[strKey] = value
        }
      }
    }
    return iter()
  }

  rowToObject (row, args, complexKey) {
    args = args || this.args.slice()
    const ret = {}

    if (this instanceof Collection) {
      while (args.length > 1) {
        const k = args.shift()
        ret[k] = row.shift()
      }
      ret[args[0]] = row[1]
    } else {
      while (args.length) {
        const k = args.shift()
        ret[k] = row.shift()
      }
    }
    complexKey = complexKey || Object.values(ret)
    for (const _k of Object.keys(this._indexData)) {
      ret[_k] = this.lookup(_k, complexKey)
    }
    if (this instanceof Counter) ret.count = row[0]
    return ret
  }
}

class Counter extends Base {
  resolve (row) {
    let data = this.data
    const args = this.args.slice()
    let indexKey = []
    while (args.length > 1) {
      const key = args.shift()
      const value = get(row, key)
      if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
      if (!data.has(value)) {
        data.set(value, new Map())
      }
      data = data.get(value)
      indexKey.push(value)
    }
    const key = args[0]
    const value = get(row, key)
    indexKey.push(value)
    indexKey = JSON.stringify(indexKey)
    this._writeIndexes(indexKey, row)
    if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
    return { indexKey, key, value, data }
  }

  add (row, increment) {
    const { value, data } = this.resolve(row)
    if (!data.has(value)) data.set(value, increment)
    else data.set(value, data.get(value) + increment)
  }

  count (row) {
    const { value, data } = this.resolve(row)
    if (!data.has(value)) data.set(value, 1)
    else data.set(value, data.get(value) + 1)
  }
}

class Collection extends Base {
  set (row) {
    let data = this.data
    const args = this.args.slice()
    let indexKey = []
    while (args.length > 1) {
      const key = args.shift()
      const value = get(row, key)
      if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
      if (!data.has(value)) {
        data.set(value, new Map())
      }
      data = data.get(value)
      indexKey.push(value)
    }
    const key = args[0]
    const value = get(row, key)
    indexKey = JSON.stringify(indexKey)
    this._writeIndexes(indexKey, row)
    if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
    data.set(key, value)
  }
}

exports.collection = (...args) => new Collection(...args)
exports.counter = (...args) => new Counter(...args)
exports.quarter = getQuarter
