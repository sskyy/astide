import DefaultEditor from '../ASTIDEDefaultEditor'
import createRouter from '../base/createRouter'
import NavigatorViews from './NavigatorViews'
import StatusBar from '../base/StatusBar'

import defaultLayout from '../ASTIDELayout'
import DefaultCodebase from '../ASTIDECodebase'
import DefaultWorkspace from '../ASTIDEWorkspace'
import DefaultFocusManager from './FocusManager'



export default class IDE {
  constructor(options = {}, components = {}) {
    const { layout = defaultLayout, Codebase = DefaultCodebase, FocusManager = DefaultFocusManager, Workspace = DefaultWorkspace, editors = {} } = options
    this.focusManager = new FocusManager()
    this.codebase = new Codebase()
    this.workspace = new Workspace()
    this.navigators = new NavigatorViews(this.codebase, Codebase, Codebase.navigators)

    this.layout = layout
    this.components = {
      StatusBar,
      ...components,
    }

    // TODO 有个 router 的过程
    this.EditorRouter = createRouter((uri) => DefaultEditor)

    // 以下是各部分间的联系
    this.navigators.on('open', (uri) => {

      if(!this.workspace.hasCodePiece(uri)) {
        // 默认增加到 last active 的 region
        this.codebase.get(uri).then(codePiece => {
          this.workspace.addCodePiece(codePiece)
        })
      }
      this.focusManager.focus('editor', uri)
    })

    this.navigators.on('remove', (uri) => {
      if(!this.workspace.hasCodePiece(uri)) {
        this.workspace.findCodePiece(uri).setState('removed', true)
      }
    })

    // TODO this.navigators 新建 action ？
    this.navigators.on('create', (uri) => {
    })

  }
  render() {
    return this.layout({
      EditorRouter: this.EditorRouter,
      focusManager: this.focusManager,
      navigators: this.navigators,
      Workspace: this.workspace.Layout,
      ...this.components,
    })
  }
}