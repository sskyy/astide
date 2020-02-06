/** @jsx createElement */
import createElement from './render/createElement';

export default function createRouter(mapFn) {
  return function Router({ type, uri, content, focused }) {
    const Editor = mapFn(uri)
    return <Editor content={content} focused={focused}/>
  }
}