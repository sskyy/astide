import { createElement, createFragment } from './dom';
import Fragment from './Fragment';

export function digest(vnodes, container) {
  if (!vnodes) return
  vnodes.forEach(vnode => {
    if (!vnode) return
    if (typeof vnode.type === 'string') {
      const current = createElement(vnode)
      digest(vnode.children, current)
      container.appendChild(current)

      if (vnode.ref) console.log(vnode.ref)
      if (vnode.ref) vnode.ref.current = current

    } else if (vnode.type === String ){
      container.appendChild(createElement(vnode))
    } else if (vnode.type === Fragment || vnode.type === Array){
      digest(vnode.children, container)
    } else if (typeof vnode.type === 'function') {
      const type = vnode.type
      const resolved = type({ ...vnode.props, children: vnode.children })
      digest([resolved], container)
    }
  })
}


export function patch(element, vtree) {
  const container = createFragment()
  digest([vtree], container)
  element.parentNode.replaceChild(container, element)
}

