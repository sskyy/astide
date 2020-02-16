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
    <block flex-display flex-direction-column>
      {layout.map(row => {
        const heightAttr = {}
        if (typeof row[0] === 'number') {
          heightAttr['block-height'] = row[0]
          heightAttr['flex-basis'] = row[0]
          heightAttr['flex-shrink'] = 0
          row.splice(0, 1)
        } else {
          heightAttr['flex-grow'] = 1
        }
        return (
          <row block flex-display {...heightAttr}>
            {row.map((def) => {
                let columnName, width
                if (Array.isArray(def)) {
                  [columnName, width] = def
                } else {
                  columnName = def
                }
                const widthAttr = {}
                if (width === undefined) {
                  widthAttr['flex-grow'] = 1
                } else {
                  widthAttr['block-width'] = width
                  widthAttr['flex-basis'] = width
                  widthAttr['flex-shrink'] = 0
                }
                return <column block {...widthAttr}>{childrenIndexByPlace[columnName]}</column>
              }
            )}
          </row>
        )
      })}
    </block>
  )
}