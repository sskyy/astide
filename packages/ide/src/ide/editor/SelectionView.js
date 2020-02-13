/** @jsx createElement */
/** @jsxFrag Fragment */
import paper from 'paper'
import createElement from '../../base/render/createElement';

const { Path, Point, Size, Shape } = paper

export default class SelectionView {
  constructor() {
  }
  select(selection) {
    const {left, top, width, height} = selection.getRect()
    console.log({left, top, width, height})
    const overflow = 2
    this.selectionObject.set({
      size: new Size(width + overflow, height),
      position: new Point(left + width/2 - overflow/2, top + height/2)
    })

  }
  render = () => {
    // TODO 为什么出不来！！！
    this.selectionObject = new Shape.Rectangle(new Point(10, 10), new Size(200, 0));
    this.selectionObject.fillColor = '#000000'
  }

}