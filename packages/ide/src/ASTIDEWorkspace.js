/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement, reactive, vnodeComputed, arrayComputed } from 'axii';
import GridView from './base/GridView';
import TabContainer from './base/TabContainer';
import Event from './base/Event'
import { invariant } from './base/util';

export default class Workspace extends Event{
  constructor() {
    super()
    this.layout = [
      ['default']
    ]

    this.regions = reactive(new Map([['default', new Set()]]))
    this.editors = new Map()
  }

  hasCodePiece() {

  }
  findCodePiece() {

  }
  addCodePiece(codePiece, region='default') {
    this.regions.get(region).add(codePiece)
  }
  saveEditorRef = ({ codePiece, editor }) => {
    // TODO 先这样简单处理
    this.focusedEditor = { codePiece, editor }
    // TODO destroy
  }
  getFocusedCodePiece() {
    return {
      ...this.focusedEditor.codePiece,
      content: this.focusedEditor.editor.content
    }
  }
  // TODO close 在这里处理
  get Layout() {

    return ({children}) => {
      const Editor = children[0]
      invariant(typeof Editor === 'function', 'should pass a editor as children 0')

      return (
        <div>
          {vnodeComputed(() =>
            <GridView layout={this.layout}>
              {Array.from(this.regions.entries(), ([regionName, codePieces]) => {
                // TODO 先用文字替代，之后改成 workspace 控制
                return (
                  <TabContainer GridView:place={regionName} key={regionName} >
                    {vnodeComputed(() => {
                      return Array.from(codePieces, (codePiece) =>
                        <Editor
                          TabContainer:header={{key: codePiece.uri, content:codePiece.name}}
                          key={codePiece.uri}
                          codePiece={codePiece}
                          ref={this.saveEditorRef}
                        />
                      )
                    })}
                  </TabContainer>
                )
              })}
            </GridView>
          )}
        </div>
      )
    }
  }

}
