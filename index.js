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
  }
  add (row) {
    let data = this.data
    let args = this.args.slice()
    while (args.length > 1) {
      let key = args.shift()
      let value = get(row, key)
      if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
      if (!data.has(value)) {
        data.set(value, new Map())
      }
      data = data.get(value)
    }
    let key = args[0]
    let value = get(row, key)
    if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
    if (!data.has(value)) data.set(value, 1)
    else data.set(value, data.get(value) + 1)
  }
  entries () {
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
      let generator = self.entries()
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
}

exports.collection = (...args) => new Collection(...args)

