import { createElement, createFragment } from './dom';
import Fragment from './Fragment';

function normalizeKey(key) {
  const arr = key.split(':')
  if (arr.length === 1) return key

  const [namespace, rawKey] = arr
  if (/^\$/.test(namespace)) return rawKey
}

export function digest(vnodes, container) {
  if (!vnodes) return
  vnodes.forEach(vnode => {
    if (!vnode) return
    if (typeof vnode.type === 'string') {
      const current = createElement(vnode)
      digest(vnode.children, current)
      container.appendChild(current)

      if (vnode.ref) {
        if (typeof vnode.ref === 'function') {
          vnode.ref(current)
        } else {
          // TODO 更严格检测
          vnode.ref.current = current
        }
      }

    } else if (vnode.type === String ){
      container.appendChild(createElement(vnode))
    } else if (vnode.type === Fragment || vnode.type === Array){
      digest(vnode.children, container)
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


export function patch(element, vtree) {
  const container = createFragment()
  digest([vtree], container)
  const newElement = container.childNodes[0]
  element.parentNode.replaceChild(newElement, element)
  return newElement
}

export function append(element, vtree) {
  const container = createFragment()
  digest([vtree], container)
  const newElement = container.childNodes[0]
  element.after(newElement)
  return newElement
}

