import { IDE, render } from '/src/index.js'
import '/src/ASTIDEDefaultLayout.less'

const root = document.getElementById('root')
const editor = new IDE()
const controller = render(editor.render(), root)
