/** @jsx createElement */
import createElement from './createElement'

export default function createUncontrolledProxy(UncontrolledComponent, mapProps = x => [x]) {
  return function UncontrolledProxy(props) {
    // TODO never update
    const afterGetRef = (ref) => {
      const component = new UncontrolledComponent(...mapProps(props))
      component.render(ref)
    }

    return <div ref={afterGetRef}></div>
  }
}