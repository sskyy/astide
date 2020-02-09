/** @jsx createElement */
import createElement from './render/createElement';

export default function createRouter(mapFn) {
  return function Router(props) {
    const Editor = mapFn(props.type)
    return <Editor {...props}/>
  }
}