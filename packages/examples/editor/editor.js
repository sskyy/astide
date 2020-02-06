import { Editor, Parser } from 'astide'
import testScript from '!!raw-loader!./testScript.js'

const root = document.getElementById('editor')
const editor = new Editor({ content: testScript, parser: new Parser()})
editor.render(root)
