export function invariant(condition, format, a, b, c, d, e, f) {
  if (format === undefined) {
    throw new Error('invariant requires an error message argument')
  }

  if (!condition) {
    debugger
    let error
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment '
        + 'for the full error message and additional helpful warnings.',
      )
    } else {
      const args = [a, b, c, d, e, f]
      let argIndex = 0
      error = new Error(
        format.replace(/%s/g, () => { return args[argIndex++] }),
      )
      error.name = 'Check'
    }

    error.framesToPop = 1 // we don't care about invariant's own frame
    throw error
  }
}

export function defaults(a, defaultValues, replaceUndefined = true) {
  const result = {}
  for (const i in a) {
    if (a[i] !== undefined || !replaceUndefined) {
      result[i] = a[i]
    }
  }
  for (const i in defaultValues) {
    if (!result.hasOwnProperty(i)) {
      result[i] = defaultValues[i]
    }
  }
  return result
}

export function last(items) {
  return items[items.length - 1]
}

export function front(items, length) {
  if (length > 0) return items.slice(0, length)
  return items.slice(0, items.length + length)
}

export function itemAt(arr, index) {
  if (index < 0) return arr[arr.length + index]
  return arr[index]
}

export function toInt(s) {
  return parseInt(s, 10)
}

export function ensureInArr(items, i) {
  if (!items.includes(i)) {
    items.push(i)
  }
  return items
}

export function createKeyGenerator() {
  return (function () {
    let key = 0
    return function () {
      return (key++).toString()
    }
  }())
}

export function isGenerator(fn) {
  return fn.constructor.name === 'GeneratorFunction'
}

export function pick(obj, keys) {
  const result = {}
  keys.forEach(k => result[k] = obj[k])
  return result
}

// TODO 改善
export function cloneDeep(a) {
  return JSON.parse(JSON.stringify(a))
}

export function mapValues(a, fn) {
  const result = {}
  Object.entries(a).forEach(([key, value]) => {
    result[key] = fn(value, key)
  })
  return result
}

export function mapLeaf(obj, fn, clone = {}) {
  invariant(typeof obj === 'object', `${obj} is not a object`)
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value !== 'object' || Array.isArray(value)) {
      clone[key] = fn(value)
    } else {
      clone[key] = {}
      mapLeaf(value, fn, clone[key])
    }
  })
  return clone
}

export function arrayEqual(a, b) {
  if (a.length !== b.length) return false
  const toCompare = [...b]
  const op = a.every((i) => {
    const index = toCompare.indexOf(i)
    if (index === -1) return false
    toCompare.splice(index, 1)
    return true
  })
  return op && b.length !== 0
}

export function splitByKeys(obj, keys) {
  const first = {}
  const rest = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (keys.includes(key)) {
      first[key] = value
    } else {
      rest[key] = value
    }
  })
  return [first, rest]
}
