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
    <directory block>
      <info block>
        <i className="material-icons">folder</i>
        <name inline inline-margin-left-4px inline-margin-right-4px>{name}</name>
        <i className="material-icons" onClick={create}>add</i>
      </info>
      <children block block-padding-left-10px>
        {vnodeComputed(() => {
          return files.map(file => isDirectory(file) ?
            (<Directory {...file} actions={actions} isDirectory={isDirectory}/>) :
            (<File {...file} actions={actions}/>)
          )
        })}
      </children>
    </directory>
  )
}

Directory.Style = function(style) {
  const infoStyle = {
    fontSize: 14,
    lineHeight: 14,
    verticalAlign: 'middle'
  }
  style.directory = {
    background: '#1e2130',
  }
  style.info = {
    color: '#ccc',
  }

  style.name = infoStyle
  style['i.material-icons'] = infoStyle
}

function File({ name, status, actions, uri }) {
  // TODO status/remove
  return (
    <ifile block>
      <i className="material-icons">insert_drive_file</i>
      <name inline inline-margin-left-4px inline-margin-right-4px>{name}</name>
      <i className="material-icons" onClick={() => actions.open(uri)}>open_in_new</i>
      <i className="material-icons" onClick={() => actions.remove(uri)}>delete</i>
    </ifile>
  )
}

File.Style = function(style) {
  const infoStyle = {
    fontSize: 14,
    lineHeight: 14,
    verticalAlign: 'middle'
  }
  style.ifile = {
    color: '#fff'
  }
  style.name = infoStyle
  style['i.material-icons'] = {
    ...infoStyle,
    cursor: 'pointer'
  }
}


export default function TreeView({ rootName = 'root', fileRoot, isDirectory, actions }) {
  return <Directory name={rootName} files={fileRoot.files} actions={actions} isDirectory={isDirectory}/>
}