import BaseAnalyze from '../../features/BaseAnalyze'
import Suggest from '../../features/Suggest'

const defaultFeatures = [BaseAnalyze, Suggest]

/**
 * TODO 注入的这个 system 怎么规划？能干什么？
 * 注入到 server 端和 client 端的是不一样的
 */
export default function useFeatures(app, pm2, features = defaultFeatures) {
  // TODO 为各种 feature 生成子进程
  // TODO 注入 system proxy

  // TODO 还要考虑跑在 worker 里的
  // worker 里面也要注入。
}
