import './format/Editor.scss'
import View from './View'
import AST from './AST'
import Selection from './Selection'
import ASTView from './ASTView'
import SelectionView from './SelectionView'
import InputBoxView from './InputBoxView'
import CommandManager from './CommandManager'
import EditingStrategy from './EditingStrategy'
import { EVENT_DOM_SELECT, EVENT_INPUT_CHANGE } from './constant';

export default class Editor {
  constructor(code) {
    this.view = new View()
    this.ast = new AST(code)

    // TODO 移到 astView 里面去，没有 domView 的信息，selection 没有意义。
    this.astView = new ASTView(this.view, this.ast)

    // TODO 如果不主动的话，render 过程也应该写在外面
    this.selectionView = new SelectionView()
    this.inputBoxView = new InputBoxView()

    this.commandManager = new CommandManager()
    this.editingStrategy = new EditingStrategy()
    this.setup()
  }
  setup() {
    this.view.getDefaultLayer().render(this.astView.render())
    this.view.pushLayer().render(this.inputBoxView.render())
    this.view.unshiftLayer().render(this.selectionView.render())

    // 转化成 selection 的格式
    this.astView.onSelect((selection) => {
      const rect = selection.getRect()
      this.inputBoxView.position(rect.x, rect.y)
      this.inputBoxView.focus()

      this.selectionView.select(selection)
    })

    // TODO astView 的 selection 还要接受快捷键、以及从 ast 操作

    // inputBox 如何更新 selection 和 ast 都是 editingStrategy 决定的。
    this.inputBoxView.onChange((e) => {
      const [astChange, selectionChange] = this.editingStrategy.run(e, this.astView)
      // console.log({astChange, selectionChange})
      // TODO 还得考虑什么时候变成一个合法的表达式。
      this.astView.applyChange(astChange)
      this.astView.applySelectionChange(selectionChange)
    })
  }
  render(container) {
    // 这才是真正的渲染到 container 上
    this.view.render(container)
  }
}

