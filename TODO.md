# 以编辑器自举为最终目标的 roadmap

roadmap 分为三个阶段：

1. 实现基本的代码编辑能力
  1. 语法实时检测
  2. 项目级的提示和补全
2. 基于 ast view 的插件系统实现
  1. 用户可自定义的针对特定数据格式的可视化编辑
3. 文件系统、项目构建系统与 IDE 完全融合，

# 第一阶段 实现基本的代码编辑能力

- 代码基本编辑能力的修复
- 语法错误检测
- 不区运行环境的插件系统(以自动提示为例)

目前 IDE 的插件体系基本还是 client/server 结构。用户的插件代码要分成 "在页面上的功能" 和 "在 server 端的功能" 两个部分来写。
希望实现开发者写的代码能不区分环境，由插件系统根据代码自动分析运行环境。