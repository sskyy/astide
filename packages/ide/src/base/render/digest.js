import { createElement, createFragment } from './dom';
import Fragment from './Fragment';
import { invariant } from '../util';

function normalizeKey(key) {
  const arr = key.split(':')
  if (arr.length === 1) return key

  const [namespace, rawKey] = arr
  if (/^\$/.test(namespace)) return rawKey
}

function attachRef(vnode, current) {
  if (vnode.ref) {
    if (typeof vnode.ref === 'function') {
      vnode.ref(current)
    } else {
      // TODO 更严格检测
      vnode.ref.current = current
    }
  }
}

export function digest(vnodes, container) {
  if (!vnodes) return
  vnodes.forEach(vnode => {
    if (!vnode) return
    if (typeof vnode.type === 'string') {
      const current = createElement(vnode)
      digest(vnode.children, current)
      container.appendChild(current)
      attachRef(vnode, current)
    } else if (vnode.type === String ){
      container.appendChild(createElement(vnode))
    } else if (vnode.type === Fragment || vnode.type === Array){
      if (vnode.type === Fragment && vnode.ref){
        const name = vnode.name || 'Fragment'
        const startCommentNode = document.createComment(`${name} start`)
        const endCommentNode = document.createComment(`${name} end`)
        const containerProxy = createFragment()
        digest(vnode.children, containerProxy)
        container.appendChild(startCommentNode)
        container.appendChild(containerProxy)
        container.appendChild(endCommentNode)
        attachRef(vnode, [startCommentNode, endCommentNode])
      } else {
        digest(vnode.children, container)
      }
    } else if (typeof vnode.type === 'function') {
      const type = vnode.type
      const props = {}
      Object.entries(vnode.props).forEach(([key, value]) => {
        const normalizedKey = normalizeKey(key)
        if (normalizedKey) props[normalizedKey] = value
      })

      const resolved = type({ ...props, children: vnode.children })
      // TODO 处理双向绑定
      digest([resolved], container)
    }
  })
}


export function patch(elements, vtree) {
  invariant(!(vtree.type === Fragment && !Array.isArray(elements)), 'fragment should match element array')
  const container = createFragment()
  digest([vtree], container)

  if (Array.isArray(elements)) {
    const [first, last] = elements
    const newElements = [...container.childNodes]
    newElements.forEach((newElement) => {
      elements.parentNode.insertBefore(newElement, first)
    })
    let current = first
    while(current) {
      elements.parentNode.removeChild(current)
      if (current !== last) {
        current = current.nextSibling
      }
    }
  } else {
    const newElement = container.childNodes[0]
    elements.parentNode.replaceChild(newElement, elements)
  }

  return Array.isArray(elements) ? [...container.childNodes] : container.childNodes[0]
}

export function append(element, vtree) {
  invariant(!(vtree.type === Fragment && !Array.isArray(element)), 'fragment should match element array')
  const container = createFragment()
  digest([vtree], container)
  if (Array.isArray(element)) {
    const toAppend = [...container.childNodes]
    toAppend.forEach(e => element[1].after(e))
    return toAppend
  } else {
    const newElement = container.childNodes[0]
    element.after(newElement)
    return newElement
  }
}

