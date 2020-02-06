/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement, reactive, vnodeComputed } from 'axii';
import GridView from './base/GridView';
import TabContainer from './base/TabContainer';

function map(c, han) {
  for(let i in c) {

  }
}

export default class Workspace {
  constructor() {
    this.layout = [
      ['default']
    ]

    this.regions = reactive(new Map([['default', new Set()]]))
  }

  hasCodePiece() {

  }
  findCodePiece() {

  }
  addCodePiece(codePiece, region='default') {
    this.regions.get(region).add(codePiece)
  }
  get Layout() {

    return ({children}) => {
      const smartEditor = children[0]
      return (
        <div>
          {vnodeComputed(() =>
            <GridView layout={this.layout}>
              {Array.from(this.regions.entries(), ([regionName, codePieces]) => {
                console.log({regionName, codePieces})
                return (
                  <TabContainer GridView:place={regionName}>
                    {vnodeComputed(() => {
                      console.log(Array.from(codePieces))
                      return Array.from(codePieces, (codePiece) => smartEditor(codePiece))
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
