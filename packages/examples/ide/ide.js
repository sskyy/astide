import { IDE, render } from 'astide'
import 'astide/ASTIDEDefaultLayout.scss'

import testScript from '!!raw-loader!./testScript.js'

const root = document.getElementById('root')
const editor = new IDE()
const controller = render(editor.render(), root)

// controller.apply(() => {
//   editor.codebase.load([{
//     type: 'javascript',
//     uri: 'd1/d2/a.js',
//     name: 'a.js',
//     content: testScript
//   }, {
//     type: 'javascript',
//     uri: 'd1/d3/b.js',
//     name: 'b.js',
//     content: testScript
//   }, {
//     type: 'javascript',
//     uri: 'd1/d3/c.js',
//     name: 'c.js',
//     content: testScript
//   }])
// })


/**
 * TODO
 * 1. editor.codebase 增加测试代码
 * 2. editor.navigator 要自动更新
 * 3. editor.navigator 自动打开第一个
 *
 * 手工：
 * 4. 修改代码
 * 5. 存储
 */
