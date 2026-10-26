# Lab1 Phase 1：SVG 编辑器（CLI）

Git 仓库地址：**待补充（当前仅有本地仓库，尚未创建远程仓库）**。

## 架构方案

### 1. 模块划分

本阶段实现一个支持六种图形、嵌套分组和撤销重做的 TypeScript CLI。划分模块时，主要隔离三类变化：输入命令语法的变化、图形编辑规则的变化、文件格式与存储方式的变化。这样修改终端交互时，不必同时修改图形模型；替换文件适配器时，也不会改变撤销逻辑。

| 目录 | 主要类 | 职责及边界 |
| --- | --- | --- |
| `src/domain/` | `Shape`、`GeometryShape`、六个具体图形类、`SvgDocument`、`ShapeFactory` | 封装几何属性和图形行为；维护 ID 唯一性、父子关系、分组和顺序。知道“如何移动矩形”，不知道“用户从终端输入了什么”，也不读写文件。 |
| `src/application/` | `EditorSession`、`History`、`DocumentStore`、`ReversibleEdit` | 管理当前文档、关联路径、撤销栈和重做栈；定义存储和历史接口。知道“什么时候提交编辑、什么时候阻断历史”，不负责 XML 或终端提示符。 |
| `src/commands/` | `Command`、`EditingCommand`、`MoveCommand` 等具体命令 | 把一次操作封装成对象，校验操作参数，调用领域行为或会话方法。命令决定“移动谁、移动多少”，不自行实现矩形与圆各自的几何计算。 |
| `src/io/` | `SvgXmlReader`、`SvgCodec`、`Transform`、`NodeDocumentStore` | 负责严格 XML 解析、SVG 与领域对象转换、缺失 ID 补全及文件读写。文件适配器通过 `DocumentStore` 接入会话。 |
| `src/cli/` | `Lexer`、`CommandRegistry`、`CommandEngine`、`Cli` | 分词并保留引号信息，按名字创建命令，统一输出错误，实现 REPL，并在启动时装配会话和 IO。 |

此外，`test/` 保存测试，`examples/` 保存课程命令脚本与 SVG 样例，`scripts/` 保存架构检查和验证入口。应用类一类一文件，文件名与类名一致。

![模块依赖包图](architecture.svg)

上图箭头指向被依赖模块；虚线表示 IO 实现 application 中的存储端口。对应的 PlantUML 包图源码为 [architecture.puml](architecture.puml)。

以 `move node2 0 100` 为例，调用路径是：`Lexer` 解析参数 → `CommandRegistry` 创建 `MoveCommand` → `EditingCommand.execute` 建立候选文档 → `MoveCommand.apply` 查找 node2 并调用 `move` → `GroupShape.move` 递归移动子孙 → `EditorSession.commit` 替换当前文档并记录历史。终端层不需要知道 node2 内部是矩形、文字还是另一个组。

### 2. 设计模式的选择与代码落地

**Command：统一封装编辑操作，保证撤销粒度。** move、delete、group 等操作都需要作为一次可撤销动作处理，因此为每种命令建立独立类。`CommandEngine` 负责触发命令，`CommandRegistry` 每次创建新的命令对象，领域图形及 `SvgDocument` 负责实际执行编辑。编辑命令继承 [`EditingCommand`](../src/commands/EditingCommand.ts)，共同使用“复制当前文档 → 在副本执行 apply → 成功后提交”的流程。具体命令只实现自己的参数检查和领域调用，不重复编写事务与历史管理代码。比如一次 group 涉及多个节点的摘除与插入，但只记录一个命令，因此 undo 一次即可整体恢复。

**Memento：用快照恢复复杂状态。** 删除组不仅要恢复图形，还要恢复所有后代、原父容器和原顺序。为避免给每类命令编写容易遗漏的逆操作，编辑命令保存前后两份 `SvgDocument` 深拷贝，并通过 `ReversibleEdit.before/after` 向 `History` 提供恢复结果。undo 恢复之前的快照，redo 恢复之后的快照；撤销后发生新的成功编辑时清空 redo。init、read、save 和修改画布尺寸成功后设置历史屏障，显示命令与失败命令不改变历史。代价是历史空间随文档大小和命令数增长，本阶段先保证正确性，未做快照压缩。

**Composite：让容器和叶子具有统一操作。** rect、circle、ellipse、line、text 和 g 均继承 `Shape`。叶子通过自身方法处理几何字段，`GroupShape` 内部封装子节点列表，并在 move/scale 时递归调用子节点的同名方法。因而 `MoveCommand` 只调用 `shape.move(dx, dy)`，不按图形类型写分支。删除组由文档摘除整棵子树完成；组的样式属性按 SVG 规则由子元素继承，已有显式子属性优先。

**Factory 与存储端口：集中创建差异，隔离外部依赖。** [`ShapeFactory`](../src/domain/ShapeFactory.ts) 将类型名映射到具体类，再调用多态 `configure`；几何属性和复制行为仍封装在图形对象中。`EditorSession` 只依赖 `DocumentStore` 接口，实际文件读写由 `NodeDocumentStore` 完成，测试则注入内存实现。这使编辑规则和历史可以在不访问磁盘的情况下验证。

按名字分派仅集中在两处，均列为后续重构项：`CommandRegistry` 的“命令名 → 创建器”和 `ShapeFactory` 的“图形名 → 构造器”。未来分别改成命令注册入口和 ShapeProvider 注册接口；当前并未实现完整插件系统，也不实现后续阶段的 box。

### 3. 依赖方向规则

| 模块 | 允许依赖 | 这样规定的理由 |
| --- | --- | --- |
| domain | 本层 | 保持领域模型独立，禁止依赖终端、历史管理、XML 和文件系统。 |
| application | 本层、domain | 会话管理领域文档，通过本层接口调用外部能力，禁止导入具体命令和文件实现。 |
| commands | 本层、application、domain | 负责编排用户操作，禁止反向依赖 CLI，禁止直接使用文件系统。 |
| io | 本层、application、domain、Node/sax | 外部适配器可以构建领域对象并实现应用接口；文件和 XML 库依赖集中在这里。 |
| cli | 各源码模块、Node | 作为最外层入口，负责命令分发、终端交互及依赖装配。 |

两个容易混淆的方向在代码中作了明确处理：共享参数 `Token` 位于 application，避免 commands 为取得参数类型而依赖 cli；`History` 依赖本层的 `ReversibleEdit` 接口，而不导入具体的 `EditingCommand`，避免 application → commands。IO 对 application 的依赖是实现 `DocumentStore`，会话通过接口使用它，因此 application 不需要导入 IO。

违反表中规则的导入即为待处理项。`scripts/CheckArchitecture.ts` 检查静态 import 与类名；发现新增的跨层依赖时，应调整职责或接口，而不是直接放宽规则。

### 4. 变化点假设

| 未来最可能的变化 | 现在预留了什么 | 暂不实现的内容及原因 |
| --- | --- | --- |
| 增加图形与复合类型 | 具体行为使用 Shape 多态，创建分派集中在 ShapeFactory。 | 新类型仍需修改工厂注册；完整 ShapeProvider、参数 schema 和 box 插件属于后续阶段，当前没有提前承诺零修改扩展。 |
| 增加 GUI 或 agent 操作入口 | 领域、会话、命令不依赖 readline，新入口可以调用同一套操作。 | 命令参数目前仍为 Token，未来结构化入口可能需要调整参数模型；当前不为尚未使用的交互方式建立整套协议。 |
| 更换存储介质或格式 | 用 DocumentStore 隔离存储，用 SvgCodec 隔离 SVG 编解码。 | 当前端口同步；云端异步存储需要改接口和调用链，本阶段不提前引入异步复杂度。 |
| 文档及历史规模增大 | 复制和恢复入口集中，可替换快照策略。 | 当前 H 条历史、每份文档 N 个元素的空间为 O(HN)。暂不做差量存储或压缩，以免先增加复杂性而削弱恢复可靠性。 |
| 扩展 SVG 兼容范围 | 格式处理集中在 IO，不支持的输入明确失败并保留原文档。 | 当前支持六种基础图形、基础属性及有限变换；完整 CSS、任意矩阵和浏览器级兼容超出本阶段范围。 |

## 过程记录

2026-10-26，用户确认从零开发，先完成本地代码与文档。先提交架构初稿，再依次实现领域模型、命令历史、SVG/CLI 和测试；Git 中保留了对应的分步提交。以下为开发中的 AI 自查与修正记录，不把 AI 的自行检查写成未发生的用户讨论。

| 问题与判断依据 | 调整 | 如何确认 |
| --- | --- | --- |
| group/delete 会改变多处父子关系，手工逆操作容易漏掉原位置。 | 采用前后快照，统一由 EditingCommand 与 History 管理。 | 对跨父容器分组、删除子树和 z-order 执行 undo/redo，检查父子关系与顺序恢复。 |
| 读 SVG 时立即分配 rect1，会与文件后面显式的 rect1 冲突。 | 先收集所有显式 ID，再按标签分配未占用的序号。 | 输入“未命名 rect 在前、rect1 在后”的文件，确认自动跳过占名并打印警告。 |
| 导入时把继承颜色全部复制到叶子，会让后续修改组颜色失效。 | 保留 fill/stroke 继承，只对归一化缩放所需的描边宽度进行处理。 | 检查读入后的叶子不新增 fill，组属性仍可修改。 |
| 容器内后面的图形缩放溢出时，前面的图形可能已经改变。 | 仅修改候选副本，完整成功后才替换当前文档。 | 构造深层数值溢出，确认失败前后文档序列化相同，已有 redo 仍可执行。 |

方案修订：IO 内部进一步分为 XML 读取、SVG 编解码、变换解析和文件适配器；加入 Token、ReversibleEdit 等共享接口；将依赖规则收紧为 commands 不依赖 io、io 实现 application 端口。新增架构检查脚本用于发现后续偏离。

## 一致性自查

**模块划分：** 实际源码与五模块方案一致，新增接口、IO 内部拆分和验证脚本已记入上述修订。48 个源码文件通过类名与文件名检查。图形属性、子节点和历史栈由类封装，编辑通过对象方法完成，没有以公共字段袋替代图形行为。

**依赖方向：** 静态检查覆盖 166 条 import，未发现违反当前规则的导入。抽样核对：`GroupShape` 只依赖领域层；`EditorSession` 依赖 DocumentStore 而非 NodeDocumentStore；`History` 依赖 ReversibleEdit 而非具体命令；`MoveCommand` 通过图形方法编辑，不直接访问终端或文件。两个名字分派点已在架构方案中明确列为待重构项。

## 质量保证手段

验证采用 Node v24.22.1、TypeScript 5.9.3。运行 `npm run check`，本机也可用 `./scripts/check.sh`；已有实际输出保存在 [validation.txt](validation.txt)。

| 验证手段 | 检查的可观察结果 |
| --- | --- |
| 严格类型与架构检查 | 类型检查通过；48 个源码文件、166 条 import 符合依赖与命名规则。 |
| 编辑及历史测试 | 六种图形、19 条命令；容器递归编辑、分组顺序、循环拒绝、删除恢复、redo 清理和 IO 历史屏障。 |
| 失败原子性测试 | 失败编辑、数值溢出、非法 SVG 和读写失败后，检查原文档、文件路径或历史没有被覆盖。 |
| SVG 往返与文件系统测试 | 检查缺失 ID 补全、中文/转义/空文字、支持的变换、实际文件读写及临时文件清理。 |
| 真实 CLI 集成测试 | 子进程从 stdin 回放课程两节点示例，保存并读回 8 个元素，确认撤销后的坐标及修改后的文字；另检查错误后继续处理命令。 |

自动化测试共 **46 项，全部通过**。这些检查为本阶段已支持的行为提供依据，不把自编测试通过等同于对任意 SVG 的兼容性保证。运行说明和具体格式边界见[项目 README](../README.md)。
