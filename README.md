# SVG 编辑器 CLI · Lab1 Phase 1

Git 仓库地址：[wuyazuholo/svg-editor-cli](https://github.com/wuyazuholo/svg-editor-cli)。

TypeScript 面向对象实现的 SVG 命令行编辑器，支持六种图形、嵌套容器、19 条命令、撤销重做和 SVG 文件读写。

**课程提交文档：[doc/README.md](doc/README.md)**，包含架构方案、PlantUML 包图、过程记录、一致性自查和质量保证依据。

## 运行

需要 Node.js **24 或更新版本**。标准环境中：

```bash
npm install
npm run cli
```

也可以使用锁定的 pnpm 依赖：`pnpm install --frozen-lockfile`。

本机开发时已安装依赖；终端尚未配置系统 Node.js，可以直接运行以下入口，自动使用 Codex 自带的 Node：

```bash
cd "/Users/wuyazu/Desktop/课程/高级软件开发技术/lab1"
./svg-editor
```

进入后输入 `help` 查看全部命令，用 `Ctrl-D` 退出。例如：

```text
init 800 600
create g scene
create rect r1 30 70 120 60 #4a90d9 in scene
create text title 45 105 "开始" in scene
move scene 20 0
undo
tree
save demo.svg
```

回放课程流程图并在浏览器中预览：

```bash
./svg-editor < examples/flowchart.commands
open flowchart.svg
```

交互模式显示 `svg> ` 提示符；批处理省略提示符，遇到错误继续处理剩余命令，并最终返回退出码 1。

## 验证

```bash
npm run check
```

本机没有系统 Node/npm 时，用等价的 `./scripts/check.sh`。检查包括 TypeScript 严格类型检查、依赖方向和类名检查，以及 46 项功能／集成测试。

目前仅实现 Phase 1；`box` 插件类型属于后续阶段。SVG 支持六种基础图形、基础几何与样式属性，以及嵌套 translate 和正数等比 scale。额外保留导入文字的数值 font-size 和 text-anchor。

根 viewBox 须匹配 `0 0 width height`；不支持旋转、非等比缩放、CSS/style、path/polygon、defs/use、tspan 或带 px/% 后缀的尺寸。不支持的输入会报错并保留当前文档。导入变换会归一化到叶子坐标，缩放的继承描边宽度可能固化为叶子属性；本项目不承诺任意 SVG 的无损往返。
