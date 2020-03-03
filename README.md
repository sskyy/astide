# ASTIDE

基于 AST editor 的完整 ide。可用本项目打造任何定制的 ide。

## FEATURE

 - 基于 AST 的编辑器，取代传统 string based editor。能为编辑时提供更多更强的辅助功能。
 - 多进程渲染架构，性能对齐 vscode。
 - 进程无感知的 feature 体系，系统自动根据代码所处生命周期分配进程。
 
## 项目结构

 - bootstrap。项目的启动脚本
 - features。自动提示、版本管理等功能。
 - ide。ide 的前端主体。
   - src/base。前端利用 iframe 实现进程分离等功能。 
   - src/ide。基于 ast 的编辑器。
 - project。当前项目的主体。
 
## 启动

见 examples 或 bootstrap。