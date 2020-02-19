// 默认全都是 inline block。只有部分要特殊处理。
const blockSelectors = [
  // 基本根据节点大类型要求的
  'program',
  'statement',
  'declaration',
  // 其他特殊情况需要的
  'ClassDeclaration ClassMethod'
]

export function layout({applyBlock, query, lengthMoreThan}) {
  blockSelectors.forEach(elementName => applyBlock(elementName))
  // 动态情况 应该怎么写？

  query('ObjectExpression ObjectProperty', (expressionNode, objectPropertyCollection) => {
    // TODO 检测文字是不是太长？
    if (lengthMoreThan(expressionNode, 20)) {
      objectPropertyCollection.forEach(o => applyBlock(o))
    }
  })

  // TODO 链式调用换行
  query('MemberExpression', (expressionNode) => {
    // TODO 检测链式调用的文字长度。
    // TODO 这是循环嵌套 的怎么处理

  })

  // TODO 如果对象的排列想写成左右对称的形式，怎么处理？
  // applyIndent。

  // TODO  函数的参数，如果想写成竖排对齐的形式，怎么处理。
  // applyChangeLine 第一行
  // applyBlock applyIndent 中间
  // applyIndent 最后一行
}

export function color() {

}

export function space() {

}
