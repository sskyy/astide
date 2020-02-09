/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement, reactive, vnodeComputed } from 'axii';
import GridView from './base/GridView';
import TabContainer from './base/TabContainer';
import Event from './base/Event'

function map(c, han) {
  for(let i in c) {

  }
}

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
  saveEditorRef = (codePiece, editor) => {
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
      return (
        <div>
          {vnodeComputed(() =>
            <GridView layout={this.layout}>
              {Array.from(this.regions.entries(), ([regionName, codePieces]) => {
                return (
                  <TabContainer GridView:place={regionName}>
                    {vnodeComputed(() => {
                      return Array.from(codePieces, (codePiece) =>
                        <Editor
                          key={codePiece.uri}
                          codePiece={codePiece}
                          refEditor={this.saveEditorRef}
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
