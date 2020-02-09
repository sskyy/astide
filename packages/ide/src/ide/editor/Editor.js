import './format/Editor.scss'
import View from './View'
import ASTView from './ASTView'
import SelectionView from './SelectionView'
import InputBoxView from './InputBoxView'
import keyCommandStrategies from './keyCommandStrategies'
import HotkeyManager from '../../base/HotkeyManager';
import * as EditingStrategies from './EditingStrategies'

// TODO 还是应该由外部传入 ast。这样更好控制 equal 等。但是还要考虑回退等操作。
export default class Editor {
  constructor({ content, parser }) {
    this.parser = parser
    this.view = new View()

    // TODO 移到 astView 里面去，没有 domView 的信息，selection 没有意义。
    this.astView = new ASTView(this.view, this.parser.parse(content))

    // TODO 如果不主动的话，render 过程也应该写在外面
    this.selectionView = new SelectionView()
    this.inputBoxView = new InputBoxView()
    // TODO 这个 hotkeyManager 要去除。
    this.hotkeyManager = new HotkeyManager({ root: document.body })
    this.setup()
  }
  setup() {

    this.view.getDefaultLayer().render(this.astView.render())
    this.view.pushLayer().render(this.inputBoxView.render())
    this.view.unshiftLayer().render(this.selectionView.render())

    // 转化成 selection 的格式
    this.astView.onSelect((selection) => {

      const rect = selection.getRect()

      console.log("selection change", rect.left, rect.top)
      // TODO 还要判断 selection endContainer 的位置
      this.inputBoxView.position(rect.left, rect.top)
      this.inputBoxView.focus()

      this.selectionView.select(selection)
    })

    /*
    TODO
    focus 的写法：
    接受外部的 focusProxy。外部也可以直接通过 focusProxy 来 focus。
    focusProxy.onFocus(() => {
      this.inputBoxView.position(rect.left, rect.top)
      this.inputBoxView.focus()
    })

    this.astView.onSelect((selection) => {
      focusProxy.focus(selection as payload)
     */


    // TODO astView 的 selection 还要接受快捷键、以及从 ast 操作
    // inputBox 如何更新 selection 和 ast 都是 editingStrategy 决定的。
    // 这里只处理插入和删除的情况。回车等其他情况在下面
    this.inputBoxView.onChange((e) => {
      // 处理文字、输入法输入，其他都不管
      EditingStrategies.replace(this.astView, this.parser, e.data)
    })

    keyCommandStrategies.forEach(({ key, handle}) => {
      // TODO 处理 backspace/tab/cmd+a/cmd+c/cmd+v/cmd+d/cmd+x/cmd+z/cmd+\/
      this.hotkeyManager.on(key, undefined, () => {
        handle(this.astView, this.parser)
      })
    })

  }
  render(container) {
    // 这才是真正的渲染到 container 上
    this.view.render(container)
  }
  get content() {
    return this.astView.stringify()
  }
}

