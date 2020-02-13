/** @jsx createElement */
import { createElement, vnodeComputed } from 'axii';

export const propNamespace = 'TabContainer'

export default function TabContainer({children, onClose, active}) {
  // TODO active 的问题。

  const headers = vnodeComputed(() => {
    return children.map(child => {
      const { key, content} = child.props[`${propNamespace}:header`]
      return (
        <div key={key}>
          <span>{content}</span>
          <span onClick={() => onClose(key)}>[x]</span>
        </div>
      )
    })
  })

  const tabs = vnodeComputed(() => children.map(child => {
    return (
      <div key={child.key}>
        {child}
      </div>
    )
  }))

  return (
    <div>
      <div>tabs:</div>
      <div>{headers}</div>
      <div>{tabs}</div>
    </div>
  )
}