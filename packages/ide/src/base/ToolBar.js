/** @jsx createElement */
import { createElement } from 'axii';

export default function ToolBar() {
  return <toolbar block block-padding-left-8px block-padding-top-4px>ASTIDE </toolbar>
}

ToolBar.Style = (style) => {
  style.toolbar = {
    background: '#000',
    color: '#fff',
  }
}