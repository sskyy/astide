import { IDE, render } from 'astide'
import 'astide/ASTIDEDefaultLayout.less'

const root = document.getElementById('root')
const editor = new IDE()
const controller = render(editor.render(), root)
