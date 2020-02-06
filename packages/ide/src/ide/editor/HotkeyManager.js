import { invariant } from '../../base/util';

function arrayEqual(a, b) {
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


// 特殊键
const functionNameToKeyCode = {
  backspace: 8,
  tab: 9,
  clear: 12,
  enter: 13,
  return: 13,
  esc: 27,
  escape: 27,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  del: 46,
  delete: 46,
  ins: 45,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  capslock: 20,
}

const modifierNameToKeyCode = {
  cmd: 91,
  alt: 18,
  ctrl: 17,
  shift: 16,
}

const modifierKeyCodeToName = Object.entries(modifierNameToKeyCode).reduce((result, [name, keyCode]) => {
  result[keyCode] = name
  return result
}, {})

function matchKeys(keys, modifierPressed, keyPressed) {
  const mataMatch = Object.entries(modifierPressed).every(([modifierKeyStr, isPressed]) => {
    const hasKey = keys[1].includes(parseInt(modifierKeyStr, 10))
    return isPressed ? hasKey : !hasKey
  })

  return keys[0] === keyPressed && mataMatch
}

function normalizeKeys(input) {
  const keys = Array.isArray(input) ? input : input.split('+')
  let key = null
  const modifiers = []
  keys.forEach((k) => {
    if (modifierNameToKeyCode[k]) {
      modifiers.push(modifierNameToKeyCode[k])
    } else if (functionNameToKeyCode[k]) {
      key = functionNameToKeyCode[k]
    } else {
      invariant(k.length === 1, `unknown key ${k}`)
      key = k.toUpperCase().charCodeAt(0)
    }
  })

  return [key, modifiers]
}

export default class HotkeyManager {
  constructor(root) {
    this.root = root

    this.modifierKeyPressed = {
      [modifierNameToKeyCode.cmd]: false,
      [modifierNameToKeyCode.alt]: false,
      [modifierNameToKeyCode.ctrl]: false,
      [modifierNameToKeyCode.shift]: false,
    }

    this.handlers = []
  }

  on(inputKey, handler) {
    const keys = normalizeKeys(inputKey)
    invariant(this.handlers.every(({ keys: registeredKeys}) => {
      return !(keys[0] === registeredKeys[0] && arrayEqual(keys[1], registeredKeys[1])
      )
    }), `hotkey: ${inputKey} is already registered`)
    this.handlers.push({ keys, handler })
  }

  isPressed(keyName) {
    return this.modifierKeyPressed[modifierNameToKeyCode[keyName]]
  }
  setup(container) {
    invariant(!this.root, 'hotkey manager already setup')
    this.root = container
    // this.root.addEventListener('keydown', (e) => {
    // TODO 判断 focus 的状态
    document.body.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) {
        return
      }

      if (modifierKeyCodeToName[e.which]) {
        this.modifierKeyPressed[e.which] = true
        return
      }


      // CAUTION 一定要在这里把 currentState 提出来，对比的时候是用这个值对比，因为 handler 执行时可能改变 state。
      // 执行操作，要能终端，不能跨 state。
      this.handlers.forEach(({ keys, handler }) => {
        if (matchKeys(keys, this.modifierKeyPressed, e.which)) {
          e.stopPropagation()
          e.preventDefault()
          handler(e)
        }
      })
    }, true) // CAUTION 一定要用 capture，否则会出现组件内的先执行，然后切换了状态，然后这里又执行。

    this.root.addEventListener('keyup', (e) => {
      if (e.isComposing || e.keyCode === 229) {
        return
      }

      if (modifierKeyCodeToName[e.which]) {
        this.modifierKeyPressed[e.which] = false
      }
    })
  }
}
