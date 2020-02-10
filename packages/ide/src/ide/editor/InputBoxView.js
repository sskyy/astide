/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement from '../../base/render/createElement';
import Fragment from '../../base/render/Fragment';
import createRef from './createRef';
import CallbackContainer from '../../base/CallbackContainer';

const CHANGE_KEY = Symbol('change')
const BLUR_KEY = Symbol('blur')


export default class InputBoxView {
  constructor() {
    this.listeners = new CallbackContainer()
    this.textareaRef = createRef()
    this.caretRef = createRef()
  }
  position(left, top) {
    this.textareaRef.current.style.left = `${left}px`
    this.textareaRef.current.style.top = `${top}px`
    this.caretRef.current.style.left = `${left}px`
    this.caretRef.current.style.top = `${top}px`
  }
  onKey(listener) {
    // 非字母的其他 key
  }
  // TODO 还要监听 blur 事件。
  focus() {
    this.caretRef.current.style.display = 'block'
    this.textareaRef.current.focus()
  }
  onChange(listener) {
    this.listeners.add(CHANGE_KEY, listener)
  }
  onBlur(listener) {
    this.listeners.add(BLUR_KEY, listener)
  }
  triggerChange = (e) => {
    e.preventDefault()
    this.listeners.call(CHANGE_KEY, e)
  }
  triggerBlur = (e) => {
    e.preventDefault()
    // 更新样式
    this.caretRef.current.style.display = 'none'
    this.listeners.call(BLUR_KEY, e)
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
      display: 'none',
      position: 'absolute',
      width: 2,
      backgroundColor: 'white',
      height: options.height,
      // 当前 (selection.lineHeight-options.height)/2
      marginTop: 4,
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
      width: 0,
      height: 0,
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
      onInput={this.triggerChange}
      onBlur={this.triggerBlur}
    />
  }
}
