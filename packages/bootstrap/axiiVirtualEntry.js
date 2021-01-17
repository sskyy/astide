import App from '/Users/jiamiu/Work/personal/astide/packages/bootstrap/node_modules/babel-loader/lib/index.js??ref--4!/Users/jiamiu/Work/personal/astide/packages/ide/src/ASTIDEDefaultEditor.js'; import { createElement,render, vnodeComputed, reactive, ref, createRef } from 'axii'
import { RPCClient } from 'astide/base/RPC';

const root = document.createElement('div')
document.body.append(root)

const client = new RPCClient()

function Client() {
  const receivedProps = ref(false)
  const valueProps = reactive({})
  const callbackProps = {}
  // 使用 client 接受 props
  client.register('_receiveProps', (remoteValueProps, remoteCallbackNames) => {
    // 区分 valueProps 和 callback props
    Object.assign(valueProps, remoteValueProps)
    remoteCallbackNames.forEach(callbackName => {
      callbackProps[callbackName] = (...argv) => {
        console.log(`calling callback ${callbackName}`, ...argv)
        return client.call(callbackName, ...argv)
      }
    })

    receivedProps.value = true
  })

  client.register('_propChange', (propName, nextValue) => {
    valueProps[propName] = nextValue
  })

  client.register('*', (methodName, ...argv) => {
    return appRef.current[methodName](...argv)
  })

  const appRef = createRef()

  // TODO 直接返回 vnodeComputed
  return vnodeComputed(() => {
      if (receivedProps.value) {
        return <App {...valueProps} {...callbackProps} ref={appRef} />
      } else {
        return null
      }
    })
}

render(<Client />, root)

// 因为 axii 是同步渲染的，所以以下可以当做是渲染结束了。
client.call('_mount')

const resizeObserver = new ResizeObserver(([entry]) => {
  const {contentRect} = entry
  // 如果和 clientWidth 相同，说明是个 block，和 iframe 默认一样，不要定死。
  const width = contentRect.width === document.body.clientWidth ? undefined : contentRect.width
  client.call('_resize', width, contentRect.height)
})
resizeObserver.observe(root)


