/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement from './DOMgen/createElement';
import Fragment from './DOMgen/Fragment'
import createRef from './createRef';
import { EVENT_DOM_SELECT } from './constant'

export default class InputBoxView {
  constructor() {
    this.listener = null
    this.textareaRef = createRef()
    this.caretRef = createRef()
  }
  position(left, top) {
    this.textareaRef.current.style.left = `${left}px`
    this.textareaRef.current.style.top = `${top}px`
    this.caretRef.current.style.left = `${left}px`
    this.caretRef.current.style.top = `${top}px`
  }
  onChange(listener) {
    this.listener = listener
  }
  focus() {
    this.textareaRef.current.focus()
  }
  onInput = (e) => {
    this.listener && this.listener(e)
  }
  render() {
    return (
      <div className="inputBoxView">
        {this.renderCaret()}
        {this.renderTextarea()}
      </div>
    )
  }
  renderCaret(options = {height: 14}) {
    const styleDOM = (
      <style>
        {`@keyframes blink {
        from {
          opacity: 0;
        }
        20% {
          opacity: 0;
        }
        80% {
          opacity: 100%;
        }
        to {
          opacity: 100%;
        }
      }`}
      </style>
    )

    const caretStyle = {
      position: 'absolute',
      width: 2,
      backgroundColor: 'white',
      height: options.height,
      left: 10,
      top: 0,
      animationDuration: '.75s',
      animationName: 'blink',
      animationIterationCount: 'infinite'
    }

    const caretDOM = <div ref={this.caretRef} style={caretStyle}></div>

    return (
      <>
        {styleDOM}
        {caretDOM}
      </>
    )
  }
  renderTextarea(options = { height: 18 }) {
    const style = {
      position: 'absolute',
      fontSize: 1,
      lineHeight: options.height,
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
      ref={this.textareaRef}
      wrap="off" autoCorrect="off"
      autoCapitalize="off" autoComplete="off" spellCheck="false"
      role="textbox" aria-haspopup="false"
      style={style}
      onInput={this.onInput}
    />
  }
}
