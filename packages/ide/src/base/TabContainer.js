/** @jsx createElement */
import { createElement, vnodeComputed, propTypes, ref } from 'axii';

export const propNamespace = 'TabContainer'

export default function TabContainer({children, onClose, activeKey}) {

  const setActiveTab = (index) => {
    activeKey.value = index
  }

  const headers = vnodeComputed(() => {
    return children.map((child, index) => {
      const { key, content} = child.props[`${propNamespace}:header`]
      return (
        <tabhead inline inline-padding-10px inline-border-bottom-3px key={key} var-active={index===activeKey.value}>
          <name inline inline-margin-right-4px onClick={() => setActiveTab(index)}>{content}</name>
          <close onClick={() => onClose(key)}>x</close>
        </tabhead>
      )
    })
  })

  const tabs = vnodeComputed(() => children.map((child, index) => {
    return (
      <block block-visible-none={index !== activeKey.value} key={child.key}>
        {child}
      </block>
    )
  }))

  return (
    <block flex-display flex-direction-column>
      <headers block>{headers}</headers>
      <block block-overflow-y-scroll flex-grow-1>{tabs}</block>
    </block>
  )
}

TabContainer.propTypes = {
  activeKey: propTypes.number.default(() => ref(0))
}

TabContainer.Style = (style) => {
  style.headers  = {
    background: '#1e2130',
    boxShadow: '0px 2px 2px #111'
  }
  style.tabhead = {
    '@define': {active: [true, false]},
    color: '#57c2b7',
    'background[active=true]': '#313652',
    'border-bottom-style[active=true]': 'solid',
    'border-bottom-color[active=true]': '#a917b5',
    fontSize: 14,
    lineHeight: 14
  }
  style.name = {
    cursor: 'pointer'
  }

  style.close = {
    color : '#ccc'
  }

}