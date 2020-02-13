// CAUTION 目前是通过 single entry component 的方式把组件打包到 iframe 里面。
import DefaultEditor from 'axii-component-iframe!../ASTIDEDefaultEditor'
import createRouter from '../base/createRouter'
import NavigatorViews from './NavigatorViews'
import StatusBar from '../base/StatusBar'

import defaultLayout from '../ASTIDELayout'
import DefaultCodebase from '../ASTIDECodebase'
import DefaultWorkspace from '../ASTIDEWorkspace'
import DefaultFocusManager from './FocusManager'
import StateManager, { defaultState } from '../base/StateManager';
import HotkeyManager from '../base/HotkeyManager';

export default class IDE {
  constructor(options = {}, components = {}) {
    const { layout = defaultLayout, Codebase = DefaultCodebase, FocusManager = DefaultFocusManager, Workspace = DefaultWorkspace, editors = {} } = options
    this.focusManager = new FocusManager()
    this.stateManager = new StateManager()
    this.hotkeyManager = new HotkeyManager({ stateManager: this.stateManager, root: document.body })
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
      this.codebase.remove(uri)
    })

    this.navigators.on('create', (path, name) => {
      this.codebase.create(path, name, 'function a (){};').then((newCodePiece) => {
        this.workspace.addCodePiece(newCodePiece)
      })
    })

    // TODO 应该进入编辑态才得行。
    this.hotkeyManager.on('cmd+s', defaultState, () => {
      this.codebase.save(this.workspace.getFocusedCodePiece())
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