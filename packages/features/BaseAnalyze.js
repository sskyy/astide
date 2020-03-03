import Feature from '../bootstrap/Feature'
/**
 * 基本的分析。
 * 1. code piece 导出的 function/var/对象
 * 2. code piece 每层作用域下可用的 function/var。需要持久和共享。
 */

export default class BaseAnalyze extends Feature {
  serverDidStart() {
    // TODO 如何获得所有 code piece ？要建立树
    const [codePieces, categories] = this.system.getCodePieces()
    // TODO  1. 给 code pieces 增加导出的 function/var/class member 信息
  }
  // editor 的 worker
  editorDidMount(editor) {
    // TODO 2. 对每个 code piece 进行分析，分析的结果要附着在 ast 上？这不应该交给 ast 去分析吗？，不然的话得存一下
    // attach 到 ast 上？
    this.system.on('editor.ast.done', (ast) => {
      // TODO 为 ast 生成分析数据。要等着来插件来取
    })
  }
}
