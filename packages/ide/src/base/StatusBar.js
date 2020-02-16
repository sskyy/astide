/** @jsx createElement */
import { createElement } from 'axii';

export default function StatusBar() {
  return <statusbar block block-padding-left-8px block-padding-top-4px>ASTIDE version: 0.0.1</statusbar>
}

StatusBar.Style = (style) => {
  style.statusbar = {
    background: '#5b3ff9',
    color: '#fff',
  }
}