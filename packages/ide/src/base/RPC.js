import CallbackContainer from './CallbackContainer';
import { invariant } from './util';

function createRecipe() {
  return Date.now().toString() + Math.floor(Math.random() * 100000).toString()
}

function createCallMessage(method, argv) {
  return {
    recipe: createRecipe(),
    isCall: true,
    message: {
      method,
      argv
    }

  }
}

function createReturnMessage(recipe, returnValue) {
  return {
    recipe,
    isReturn: true,
    message: {
      returnValue
    }
  }
}

function createErrorMessage(recipe, message) {
  return {
    recipe,
    isError: true,
    message,
  }
}

function createDefer() {
  const defer = {}
  const promise = new Promise((resolve, reject) => {
    defer.resolve = resolve
    defer.reject = reject
  })

  promise.defer = defer
  return promise
}

export class RPCHost{
  constructor(timeout = 1000) {
    this.target = null
    this.recipeToDefer = new WeakMap()
    this.handlers = new WeakMap()
    this.timeout = timeout
    this.setupListener()

  }
  derive(target) {

    return {
      register: (method, handler) => {
        let handlers = this.handlers.get(target)
        if (!handlers) {
          this.handlers.set(target, (handlers = new Map()))
        }

        handlers.set(method, handler)
      },
      call: (method, ...argv) => {
        const defer = createDefer()
        const message = createCallMessage(method, argv)
        target.postMessage(message)
        let recipes = this.recipeToDefer.get(target)
        if (!recipes) {
          this.recipeToDefer.set(target, (recipes = new Map()))
        }
        recipes.set(message.recipe, defer)

        // TODO 超时检查
        return defer
      }

    }
  }
  setupListener() {
    window.addEventListener("message", (event) => {
      const { data, source } = event
      const { recipe, message, isReturn, isCall, isError } = data

      if (isCall) {
        // 收到调用请求
        // TODO 验证 target
        const handlers = this.handlers.get(source)
        if (!handlers) return
        let handler = handlers.get(message.method)
        let returnMessage
        if (handler) {
          returnMessage = createReturnMessage(recipe, handler(...message.argv))
        } else if ((handler = handlers.get('*'))){
          returnMessage = createReturnMessage(recipe, handler(message.method, ...message.argv))
        } else {
          returnMessage = createErrorMessage(recipe, `unknown method ${message.method}`)
        }
        source.postMessage(returnMessage)
      } else if (isReturn || isError){
        // 收到返回值或者错误。
        const recipes = this.recipeToDefer.get(source)
        if (!recipes) return

        if (isReturn) {
          recipes.get(recipe).defer.resolve(message.returnValue)
        } else {
          recipes.get(recipe).defer.reject(message)
        }

        recipes.delete(recipe)
      }

    }, false)
  }
}

export class RPCClient{
  constructor(timeout = 1000) {
    this.target = null
    this.recipeToDefer = new Map()
    this.timeout = timeout
    this.setupListener()
    this.handlers = new Map()
  }
  register(method, handler) {
    invariant(!this.handlers.get(method), `${method} already set`)
    this.handlers.set(method, handler)
  }
  setupListener() {
    window.addEventListener("message", (event) => {
      const { data, source } = event
      const { recipe, message, isReturn, isCall, isError } = data

      if (isCall) {
        // 收到调用请求
        // TODO 验证 target
        let handler = this.handlers.get(message.method)
        let returnMessage
        if (handler) {
          returnMessage = createReturnMessage(recipe, handler(...message.argv))
        } else if ((handler = this.handlers.get('*'))){
          returnMessage = createReturnMessage(recipe, handler(message.method, ...message.argv))
        } else {
          returnMessage = createErrorMessage(recipe, `unknown method ${message.method}`)
        }
        source.postMessage(returnMessage)
      } else if (isReturn || isError){
        // 收到返回值或者错误。
        if (isReturn) {
          this.recipeToDefer.get(recipe).defer.resolve(message.returnValue)
        } else {
          this.recipeToDefer.get(recipe).defer.reject(message)
        }

        this.recipeToDefer.delete(recipe)
      }

    }, false)
  }
  call(method, ...argv) {
    const defer = createDefer()
    const message = createCallMessage(method, argv)
    window.parent.postMessage(message)
    this.recipeToDefer.set(message.recipe, defer)

    // TODO 超时检查
    return defer
  }
}