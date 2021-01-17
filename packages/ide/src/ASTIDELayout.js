/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement } from 'axii';

/**
 * layout 的需求就是整个界面的需求，base 里面有限提供各种工具。目前这个空间里还混杂了
 * 1. 逻辑语意。有关联的数据。
 * 2. UI 的需求。
 * 还没到能稳定分层的程度，所以以工具为主。
 *
 * layout 的约定：
 *  - navigator。系统包装过的对象，记录当前 opened/focused 的 code piece。active 是由其他组件决定的，例如 tabContainer。
 *  - TODO userData.workspace。 里面记录了用户当前的 workspace 布局以及打开了哪些代码。注意这里的状态和 navigator 有同步关系。
 *  - Navigator。codeBase 的主渲染视图。当 code piece 状态变化时会自动变化。
 *  - EditorRouter。编辑器分发，会根据注册的代码类型和编辑器来自动选择。
 *  - focusManager
 *  - StatusBar
 *
 *
 * GridView/TabContainer 和业务逻辑无关，当成 util 来提供
 */
import GridView from './base/GridView'

export default function layout({ navigators, EditorRouter, StatusBar, focusManager, Workspace, ToolBar }) {
  // TODO 这里有个领域问题，Editor 实际上不需要知道自己是否是 active。只是出于性能需要所以传入的。active 只是 codePiece 需要知道而已。怎么表达这个性能优化逻辑。

  const MainNavigator = navigators.Main

  const windowLayout = [
    [30, 'top'],
    [['left', 200], 'right'],
    [30, 'bottom']
  ]

  const Editor = (props) => (
    <EditorRouter
      {...props}
      focused={focusManager.deviate('editor', props.uri)}
      onFocus={() => focusManager.focus('editor', props.uri)}
    />
  )

  return (
    <GridView layout={windowLayout} layout:block-height="100%">
      <ToolBar GridView:place="top" layout:block-height="100%"/>
      <MainNavigator GridView:place="left" layout:block-height="100%" layout:block-overflow-x-scroll/>
      <Workspace GridView:place="right" layout:block-height="100%" Editor={Editor}/>
      <StatusBar GridView:place="bottom" layout:block-height="100%"/>
    </GridView>
  )
}


