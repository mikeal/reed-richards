
let get = (data, key) => {
  key = key.split('.')
  while (key.length) {
    data = data[key]
  }
  return data
}

class Collection {
  constructor () {
    this.data = new Map()
  }
  add (row, ...args) {
    let data = this.data
    while (args.length > 1) {
      let key = args.shift()
      let value = get(row, key)
      if (typeof value === 'undefined') throw new Error(`This row does not have a property: ${key}`)
      if (!data.has(value)) {
        data.set(value, new Map())
      }
      data = data.get(value)
    }
    let key = args.shift()
    if (!data.has(key)) data.set(key, 1)
    else data.set(data.get(key) + 1)
    return new Mutation(data, row)

  }
  entries () {
    let iter = function * (row, data) {
      for (let [key, value] of data.entries()) {
        row.push(key)
        if (typeof value === 'number') {
          yield row.concat([value])
        } else if (value instanceof Map) {
          yield * iter(row, value)
        }
      }
    }
    return iter([], this.data)
  }
  unique () {
    return (function * () {
      let key = null
      let unique = new Set()
      let row
      for (row of this.entries()) {
        let k = row[row.length - 3]
        if (key === null) key = k
        unique.add(k)
        if (k !== key) {
          yield row.slice(0, row.length -3).concat([unique.size])
          unique = new Set()
        }
      }
      yield row.slice(0, row.length -3).concat([unique.size])
    })()
  }
}

