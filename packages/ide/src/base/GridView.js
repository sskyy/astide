/** @jsx createElement */
import { createElement } from 'axii';

export const propNamespace = 'GridView'

export default function GridView({layout, children }) {

  const childrenIndexByPlace = {}
  children.forEach((child) => {
    if (!child.props) debugger
    childrenIndexByPlace[child.props[`${propNamespace}:place`]] = child
  })

  return (
    <div>
      {layout.map(row => (
        <div>
          {row.map(column => (
            <div>{childrenIndexByPlace[column]}</div>
          ))}
        </div>
      ))}
    </div>
  )
}