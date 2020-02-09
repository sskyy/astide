/** @jsx createElement */
import { createElement } from 'axii'
import Editor from './ide/editor/Editor'
import Parser from './base/Parser';

/**
 * 为这么这里的 Parser 不和 codebase 的 parser 通过代码强约定呢？
 * 因为都是 ASTIDE 这个级别的，在项目中就应该已经约定了。
 * 这里把 Editor 当成工具来用
 */

export default function ASTIDEDefaultEditor({ codePiece, refEditor, focused }) {
  // CAUTION  axii 下，只会 render 一次。所以可以这样写。
  // 只会 render 一次
  const editor = new Editor({ content: codePiece.content, parser: new Parser() })

  // 给外部引用
  refEditor(codePiece, editor)

  const renderEditor = (ref) => {
    editor.render(ref)
  }

  const style= {
    background: '#282a36'
  }
  return (
    <div  style={style}>
      <div ref={renderEditor}></div>
    </div>

  )

}

