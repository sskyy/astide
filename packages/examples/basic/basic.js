import Editor from 'astide/Editor'
import testScript from '!!raw-loader!./testScript.js'

const root = document.getElementById('root')
const editor = new Editor(testScript)
editor.render(root)
