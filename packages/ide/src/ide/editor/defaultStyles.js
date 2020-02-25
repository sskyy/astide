// 默认全都是 inline block。只有部分要特殊处理。
const typeChecks = [
  // 基本根据节点大类型要求的
  'Program',
  /(?<!block)statement/i,
  /declaration/i,
  // 其他特殊情况需要的
  'ClassMethod',
  'ClassProperty',
]

export function layout(node, {applyBlock, query, lengthMoreThan}) {
  const typeCheckPassed = typeChecks.some(check => {
    return (typeof check === 'string') ? node.type === check : check.test(node.type)
  })

  if(typeCheckPassed) {
    // type check 成功后去掉 一些特殊情况
    const exportDeclaration = ['ExportDefaultDeclaration', 'ExportDeclaration', 'ExportNamedDeclaration']
    if (exportDeclaration.includes(node.parentInfo.parentNode.type)) return false

    return typeCheckPassed
  } else {
    // object property 等特殊情况

  }
}


/**
 * color 的处理只出现在单给 literal/节点上。
 * 之后的插件，分析未声明、未使用的情况也是作用在这上面。
 */
export function color(style, { type, within }) {

  // 应该也是可读 context，来动态给 vnode 加上 style。
  // 1. 基本类型的颜色设置 variable/literal/keyword/identifier(和 variable 的关系)？
  style.keyword = '#bd93f9'
  style.literal = '#abff72'
  style.literal[type('StringLiteral')] = '#abff72'
  style.literal[type('NumericLiteral')] = '#ffef83'

  style.variable = '#ffb66a'
  style.identifier = '#677af0'
  style.identifier[within('MemberExpression')]
  // 2. literal 中的类型分别

  // 3. 场景下的颜色设置，例如 this/member property
  return function hijack(node) {
    // 对 literal 类型进行分别 是否应该去掉 variable？

  }
  // 实现方式可以是先声明基础的样式，然后在 hijack 的时候去修改 vnode
}

export function space() {
  // 应该同 color。先有基本的类型，然后再通过运行的进行选择。
  return function hijack(node) {

  }
}
