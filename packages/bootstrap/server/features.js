import BaseAnalyze from '../../features/BaseAnalyze'
import Suggest from '../../features/Suggest'

const defaultFeatures = [BaseAnalyze, Suggest]

const serverSideHooks = ['serverDidStart']

function createSystemProxy() {
  return {}
}

/**
 * TODO 注入的这个 system 怎么规划？能干什么？
 * server 端：
 * 1. 在 server 端注入的 system 可以用来获取全部数据。
 *
 * client 端：
 * 1. 获取整个 view。由 view 层为其提供服务。
 */

// TODO feature 可以有顺序啊！！！

module.exports = function useFeatures(app, pm2, Features = defaultFeatures) {
  // TODO 为各种 feature 生成子进程
  const features = {}


  Features.forEach(async (Feature) => {
    if (serverSideHooks.some(method => Feature.prototype.hasOwnProperty(method))) {
      await pm2.connectP()
      const instance = new Feature()
      instance.system = createSystemProxy

      const [app] =  await pm2.startProcessP({
        script: '', // TODO
      })

      features[Feature.name] = {
        instance,
        process: app
      }
    }
  })

  // TODO 全部启动完，开始这行生命周期

  // TODO 注入到浏览器端的主进程 worker 里
  // TODO 注入到 editor 进程的 worker 里
}
