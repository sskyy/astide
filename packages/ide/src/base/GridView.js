/** @jsx createElement */
import { createElement } from 'axii';
export const propNamespace = 'GridView'

export default function GridView({layout, children }) {

  const childrenIndexByPlace = {}
  children.forEach((child) => {
    if (!child.props) debugger
    childrenIndexByPlace[child.props[`${propNamespace}:place`]] = child
  })

  // TODO 这个组件必须有 transfer key，才能解决 key 的问题。
  // TODO 一个组件既能实现 block 又能实现 inline-block 如何表示？
  // block 和 inline-block 是作为关键字还是加前缀？ i-block

  // TODO 应该委托 split 实现。
  return (
    <block>
      {layout.map(row => (
        <block>
          {row.map(column => (
            <div>{childrenIndexByPlace[column]}</div>
          ))}
        </block>
      ))}
    </block>
  )
}