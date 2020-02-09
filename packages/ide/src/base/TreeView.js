/** @jsx createElement */
import { createElement, vnodeComputed } from 'axii';

/**
 ReactivePiece 的使用：
 - uri。要渲染的 uri
 - children。用于渲染的 Component
 - status。会传递各种状态进来。

 Reactive 的使用：
 - match。命中时才会重新渲染。
 - children。用于渲染的 Component


 View 是如何进行第一次展示，是用延迟的方式还是一次性读取，由 View 和 Storage 自己约定。
 */

function Directory({ name, path, files, actions, isDirectory }) {

  function create() {
    const filename = prompt('file name:')
    actions.create(path, filename)
  }

  return (
    <div>
      <div>
        <span>[{name}]</span>
        <button onClick={create}>+</button>
      </div>
      <div style={{paddingLeft: 10}}>
        {vnodeComputed(() => {
          return files.map(file => isDirectory(file) ?
            (<Directory {...file} actions={actions} isDirectory={isDirectory}/>) :
            (<File {...file} actions={actions}/>)
          )
        })}
      </div>
    </div>
  )
}

function File({ name, status, actions, uri }) {
  // TODO status/remove
  return (
    <div>
      <span>{name}</span>
      <button onClick={() => actions.open(uri)}>open</button>
      <button onClick={() => actions.remove(uri)}>remove</button>
    </div>
  )
}


export default function TreeView({ rootName = 'root', fileRoot, isDirectory, actions }) {
  return <Directory name={rootName} files={fileRoot.files} actions={actions} isDirectory={isDirectory}/>
}