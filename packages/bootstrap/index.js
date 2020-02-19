/**
 * 应该接受来自命令行的命令。这个也是和 IDE 的约定:
 * run: IDE 产出物的正式启动，不管是启动网站、应用程序、还是其他。当点击 IDE 上的运行按钮时，正式启动产出物。
 *
 * dev: 开发模式。当使用 IDE 进行开发时，会调用此命令。开发模式下应用要通常要做一下几件事：
 * 1. 监听代码变化，为代码提供全局的分析。
 * 2. 提供代码的调试界面，也可以是正式产出物。监听变化，动态刷新。
 *
 * build: 打包产出，如果有的话。当点击 IDE 上的 build 按钮时，执行此命令。
 *
 */
