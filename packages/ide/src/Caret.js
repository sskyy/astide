/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement from '../DOMgen/createElement'
import Fragment from '../DOMgen/Fragment'

export default class Caret {
  static createElement = function(caretId, options = { height: 18 }) {
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

    const caretDOM = <div id={caretId} style={caretStyle}></div>

    return (
      <>
        {styleDOM}
        {caretDOM}
      </>
    )
  }
  constructor(el) {
    this.el = el
    this.t = 0
    this.l = 0
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
  moveRight(width) {
    this.l += width
    this.el.style.left = `${this.l}px`
  }
}