import Feature from '../bootstrap/Feature'

/**
 * 理论上希望通过通过分析代码来实现监听。现在还做不到，所以用生命周期的写法
 * system 是注入的
 */
export default class Suggest extends Feature{
  viewDidRender() {
    // system 是注入的。
    this.system.editor.current.onInput(function* onInput(content, context){
      /**
       * 2. 调用相应的规则
       * 如果输入的是
       * 0. 导入 import 时的提示。去 baseAnalyze server 上面找。
       * 1 未决定结构时提示的是函数名、作用域下的变量名。去 baseAnalyze 中 client 上面去找
       * 2 获取对象的 member。要去对象的定义上找？
       */
      const suggestions = yield this.system.feature.base.getSuggestion(content, context)

      // 3. 显示在页面上？
      const insertContent = (content) => {
        this.system.editor.current.insert(context.selection, content)
      }

      this.system.editors.current.popup(() => {
        suggestions.map(({label, type, content}) => (
          <suggest onSelect={() => insertContent(content)}>
            <type>{type}</type>
            <label>{label}</label>
          </suggest>
        ))
      })
    }, /* 应该有个参数来指定是否能重叠 */)
  }
}

