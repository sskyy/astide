/** @jsx createElement */
import createElement from '../DOMgen/createElement';

export default class Textarea {
  static createElement = function (id, height=18) {
    const style = {
      position: 'absolute',
      fontSize: 1,
      lineHeight: height,
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      resize: 'none',
      overflow: 'hidden',
      outline: 'none',
      outlineOffset: -2,
      margin: 0,
      padding: 0,
      caretColor: 'white',
      border: 'none',
      backgroundColor: 'transparent'
    }
    return <textarea
      id={id}
      wrap="off" autoCorrect="off"
      autoCapitalize="off" autoComplete="off" spellCheck="false"
      role="textbox" aria-haspopup="false"
      style={style}
    />
  }
  constructor(el) {
    this.el = el
    this.t = 0
    this.l = 0
    this.listener = null
    this.setup()
    this.focused = false
  }
  setup() {
    this.el.addEventListener('blur', () => {
      this.focused = false
    })

    this.el.addEventListener('input', (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      if (this.listener) this.listener(e)
    }, { capture: true })

    this.el.addEventListener('keydown', (e) => {

    })
  }
  top( t ) {
    if (!t) return this.t
    this.t = t
    this.el.style.top = `${t}px`
  }
  left( l ) {
    if (!l) return this.l
    this.l = l
    this.el.style.left = `${l}px`
  }
  focus(options) {
    this.focused = true
    this.el.focus(options)
  }
  onInput(listener) {
    this.listener = listener
  }
  isFocused() {
    return this.focused
  }
}