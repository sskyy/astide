import { createElement, useImperativeHandle, toRaw, isReactiveLike } from 'axii'
import hostHub from 'astide/base/loaders/axiiComponentHostHub'
import { mapValues } from 'astide/base/util';

function appendStyle(doc, content) {
  const css = doc.createElement('style');
  css.type = 'text/css';
  css.appendChild(doc.createTextNode(content))
  doc.getElementsByTagName("head")[0].appendChild(css);
}


function createIframe() {
  const iframe = document.createElement('iframe');

  iframe.display = "block";
  iframe.style.width = "100%";
  iframe.style.height = "100px";
  iframe.style.borderWidth = "0";
  iframe.scrolling="no"
  iframe.frameborder="0"
  function injectScript() {
    const childDocument = iframe.contentWindow.document;
    const script = childDocument.createElement('script');
    script.src = "__URL__";
    script.type = 'text/javascript';
    childDocument.body.appendChild(script);
    appendStyle(childDocument, `
      body{ 
        margin: 0; 
        padding: 0; 
        overflow-x:visible;
        overflow-y:visible;
      }
    `)
  }
  if (iframe.attachEvent) {
    iframe.attachEvent('onload', injectScript);
  } else {
    iframe.addEventListener('load', injectScript);
  }
  return iframe
}


export default function Host(props = {}, ref) {

  const valueProps = {}
  const callbackProps = {}
  let host
  let mounted = false

  Object.entries(props).forEach(([key, value])=>{
    if (typeof value === 'function') {
      callbackProps[key] = value
    } else {
      valueProps[key] = value
    }
  })

  // 使用 useImperativeHandler，将实例的调用转发过去
  if (ref) {
    useImperativeHandle(ref, new Proxy({}, {
      get(target, method) {
        return function(...argv) {
          if (!mounted) throw new Error(`client not mounted, iframe is ${host ? '' : 'not'} attached.`)
          return host.call( method, ...argv)
        }
      }
    }))
  }


  const onMount = (ref) => {
    const iframe = createIframe()
    ref.appendChild(iframe)
    host = hostHub.derive(iframe.contentWindow)

    host.register('_mount', () => {
      // 传入初始值。
      mounted = true
      host.call('_receiveProps', mapValues(valueProps, (prop) => {
        return isReactiveLike(prop) ? toRaw(prop) : prop
      }), Object.keys(callbackProps))
      // TODO 还要支持 reactive, reactive 要递归遍历。
    })

    host.register('_resize', (width, height) => {
      if (width) iframe.style.width = `${width}px`
      iframe.style.height = `${height}px`
    })

    Object.entries(callbackProps).forEach(([key, callback])=>{
      // 注册回调
      host.register(key, callback)
    })
  }

  return createElement('div', {
    ref: onMount
  })
}
