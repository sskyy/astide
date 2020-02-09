/** @jsx createElement */
import { createElement, reactive, watch } from 'axii';
import TreeView from './base/TreeView'
import CallbackContainer from './base/CallbackContainer';
import Dexie from 'dexie';

/*
codebase 和 navigator 的关系：
因为 navigator 展现的可能是运行时的分析，可能还有些其他类似于 "转化/合并" 等高级的处理代码的操作。
都可能直接从 navigator 发起，由 codebase 来实现。注意 codebase 并不是 storage。

这个文件是 IDE 默认的 codebase 实现，我们默认只实现一个简单的树形。

系统和 CodeBase 的约定：
Storage:
 - get 获取 uri 的具体内容。当调用 view 上的 open 时，open 调用了 storage 的 get 获取具体内容。
 - save 保存 ast。当 editor 中 save 时进行的保存。

 代码的状态 如 draft/lint/git/lock 的状态全部放到外部。不放在 storage 里面

 当前 codebase 的文件结构
 [ name: xxx, files: [] ] 如果没有 files 说明是 directory

 */

function addFile(root, {uri, name}) {
  const path = uri.split('/')
  // 最后一个是名字
  path.pop()

  let current = root
  path.forEach((p, i) => {
    let dir = current.files.find(f => f.name === p)
    if (!dir) {
      dir = { name: p, files: [], path: path.slice(0, i + 1) }
      current.files.push(dir)
    }
    current = dir
  })

  current.files.push({ uri, name })
}

function makeTree(files) {
  const tree = {
    name: 'root',
    files: []
  }

  files.forEach((file) => {
    addFile(tree, file)
  })

  return tree
}

export default class Codebase {
  static isDirectory(item) {
    return Array.isArray(item.files)
  }
  static navigators = {
    Main({ codebase, Codebase, ...rest }) {
      return <TreeView fileRoot={codebase.getFileRoot()} isDirectory={Codebase.isDirectory} {...rest}/>
    }
    // TODO 其他视图
  }
  constructor() {
    this.watchMap = new CallbackContainer()
    this.db = new Dexie("code_storage");
    this.db.version(1).stores({
      code: 'uri'
      // code: 'uri,source,isValid'
    });

    // 这是和 navigator 的约定
    this.fileRoot = reactive({files: []})

    this.loadDBFiles()

  }
  loadDBFiles() {
    return this.db.code.toArray(files => this.load(files))
  }
  load(flatFiles) {
    this.db.code.bulkPut(flatFiles)
    this.fileRoot.files.push(...makeTree(flatFiles).files)
  }
  addFile(file) {
    addFile(this.fileRoot, file)
  }
  // 这是跟 Editor 约定的接口，通过这两个接口来和 workspace 等串联起来。
  get(uri) {
    // TODO 返回一个 proxy 对象，这样就知道哪个数据被使用了？？
    return this.db.code.get({ uri })
  }
  save(codePiece) {
    return this.db.code.put(codePiece)
  }

  // 这是和 navigator View 的约定。以后可能有更多
  getFileRoot() {
    return this.fileRoot
  }
  create(path = [], name, content) {
    const newCode = { uri: [...path, name].join('/'), content, name }
    this.addFile(newCode)
    return this.db.code.add(newCode).then(() => newCode)
  }
}
