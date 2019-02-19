let get = (data, key) => {
  key = key.split('.')
  while (key.length) {
    let k = key.shift()
    data = data[k]
  }
  return data
}

class Collection {
  constructor (...args) {
    this.data = new Map()
    this.args = args
    this._indexes = {}
    this._indexData = {}
  }
  add (row) {
    let data = this.data
    let args = this.args.slice()
    let indexKey = []
    while (args.length > 1) {
      let key = args.shift()
      let value = get(row, key)
      if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
      if (!data.has(value)) {
        data.set(value, new Map())
      }
      data = data.get(value)
      indexKey.push(value)
    }
    let key = args[0]
    let value = get(row, key)
    indexKey.push(value)
    indexKey = JSON.stringify(indexKey)
    this._writeIndexes(indexKey, row)
    if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
    if (!data.has(value)) data.set(value, 1)
    else data.set(value, data.get(value) + 1)
  }
  _writeIndexes (indexKey, data) {
    for (let key of Object.keys(this._indexes)) {
      let prev = this._indexData[key][indexKey]
      this._indexData[key][indexKey] = this._indexes[key](data, prev)
    }
  }
  lookup (indexKey, complexKey) {
    return this._indexData[indexKey][JSON.stringify(complexKey)]
  }
  rowToObject (row) {
    let args = this.args.slice()
    let ret = {}
    while (args.length) {
      let k = args.shift()
      ret[k] = row.shift()
    }
    for (let _k of Object.keys(this._indexData)) {
      ret[_k] = this.lookup(_k, Object.values(ret))
    }
    ret.count = row[0]
    return ret
  }
  objects () {
    const self = this
    let iter = function * () {
      for (let row of self.rows()) {
        yield self.rowToObject(row)
      }
    }
    return iter()
  }
  rows () {
    let iter = function * (row, data) {
      for (let [key, value] of data.entries()) {
        let _row = row.slice()
        _row.push(key)
        /* istanbul ignore else */
        if (typeof value === 'number') {
          yield _row.concat([value])
        } else if (value instanceof Map) {
          yield * iter(_row, value)
        } else {
          throw new Error(`Interal data error: ${key} not Map or number`)
        }
      }
    }
    return iter([], this.data)
  }
  unique () {
    const self = this
    const toKey = value => JSON.stringify(value.slice(0, value.length - 2))
    let iter = function * () {
      let generator = self.rows()
      let { value, done } = generator.next()
      let key = toKey(value)
      let i = 0
      while (!done) {
        let _key = toKey(value)
        if (key === _key) {
          i += 1
        } else {
          yield JSON.parse(key).concat([i])
          i = 1
          key = _key
        }
        let next = generator.next()
        value = next.value
        done = next.done
      }
      yield JSON.parse(key).concat([i])
    }
    return iter()
  }
  index (key, fn) {
    this._indexes[key] = fn
    this._indexData[key] = {}
  }
}

exports.collection = (...args) => new Collection(...args)
