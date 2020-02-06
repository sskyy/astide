/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement from '../../base/render/createElement';
import createRef from './createRef';

export default class SelectionView {
  constructor() {
    this.layer = createRef()
  }
  select(selection) {
    const {left, top, width, height} = selection.getRect()
    this.layer.current.style.left = `${left}px`
    this.layer.current.style.top = `${top}px`
    this.layer.current.style.width = `${width}px`
    this.layer.current.style.height = `${height}px`
  }
  render() {
    // render 一个 canvas
    const style = {
      position: 'absolute',
      border: '1px #000 solid',
      background: '#000',
      zIndex: -1
    }
    return <div style={style} ref={this.layer}></div>
  }

}