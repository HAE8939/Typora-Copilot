# Typora Copilot (AI 助手插件)

![Platform](https://img.shields.io/badge/platform-Typora-green.svg) ![License](https://img.shields.io/badge/license-MIT-blue.svg)

基于 [typora_plugin](https://github.com/obgnail/typora_plugin) 框架开发的 Typora AI 助手插件。
支持 **多模型切换**（如智谱 GLM-4.7、DeepSeek、Kimi 等），集成了流式对话、上下文感知、一键插入文档等功能，是 Typora 写作的得力助手。

![Plugin Preview](./preview.png)
*(建议在此处上传一张运行时的截图)*

## ✨ 核心特性

* **🔄 多模型一键切换**：在界面顶部下拉框中预设多个模型（如“省钱版”、“旗舰版”），一键无缝切换配置。
* **💰 Token 成本优化**：
    * **智能引用**：默认不发送全文。支持手动开启“全文引用”或自动检测“选区引用”。
    * **历史管理**：提供“清空”按钮，随时重置上下文，避免无效 Token 消耗。
* **📝 深度写作辅助**：
    * **选区感知**：选中一段文本，自动作为上下文发送给 AI。
    * **一键插入**：AI 回复内容可一键插入到文档光标处。
    * **Markdown 复制**：一键复制 AI 生成的 Markdown 源码。
* **🚀 便捷入口**：
    * 支持快捷键唤醒 (`Ctrl+Alt+I`)。
    * 集成 QuickButton 右下角悬浮窗，点击图标即可调用。

## 🛠️ 安装步骤

### 1. 前置准备
确保你已安装 Typora，并成功注入了 [obgnail/typora_plugin](https://github.com/obgnail/typora_plugin) 插件系统。

### 2. 安装插件核心文件
1. 下载本项目中的 `typoraCopilot.js` 文件。
2. 将该文件放入 Typora 插件目录：
   `resources/app/plugin/custom/plugins/`

> **⚠️ 注意**：文件名必须严格为 `typoraCopilot.js` (大小写敏感)，否则后续悬浮窗无法回调。

### 3. 配置模型 (TOML)
1. 下载本项目中的 `custom_plugin.user.toml` 文件（或将内容复制到你现有的配置文件中）。
2. 文件位置：`resources/app/plugin/global/settings/custom_plugin.user.toml`
3. **使用记事本打开该文件**，配置调用的AI模型信息。

本插件支持配置多个模型方案 (Profiles)，示例如下：

```toml
[typoraCopilot]
name = "AI 助手"
enable = true
hide = false
order = 1
hotkey = "ctrl+alt+i"   # 唤醒快捷键
active_index = 0        # (自动维护) 记录上次使用的模型索引

# --- 模型方案列表 (支持添加多个) ---

# 方案 1: 智谱 GLM-4-Flash
[[typoraCopilot.profiles]]
name = "🚀 GLM-4 Flash (免费)"
model = "glm-4-flash"
apiUrl = "[https://open.bigmodel.cn/api/paas/v4/chat/completions](https://open.bigmodel.cn/api/paas/v4/chat/completions)"
apiKey = "sk-xxxxxxxxxxxxxxxxxxxxxxxx"  # 替换为你的 Key
max_context = 8000

# 方案 2: DeepSeek V3
[[typoraCopilot.profiles]]
name = "🐳 DeepSeek V3"
model = "deepseek-chat"
apiUrl = "[https://api.deepseek.com/chat/completions](https://api.deepseek.com/chat/completions)"
apiKey = "sk-xxxxxxxxxxxxxxxxxxxxxxxx"
max_context = 4000
```

### 4. 配置右下角悬浮窗 (UI 配置)

无需修改配置文件，直接在 Typora 软件内设置即可。

1. **打开配置菜单**：在 Typora 菜单栏或右键菜单中找到 `常用插件` -> `插件配置` -> `悬浮动作按钮 (QuickButton)`。
2. **启用插件**：确保顶部的“启用”开关已打开。
3. **添加/修改按钮**：
   - 在“预设按钮”列表中，找一个现有按钮替换（或点击 `+` 新增）。
   - 按照下图填写配置信息：

| **字段**       | **填写内容**         | **说明**                                        |
| -------------- | -------------------- | ----------------------------------------------- |
| **行号/列号**  | 自定义 (如 `4`, `1`) | 按钮在矩阵中的位置                              |
| **图标**       | `fa fa-comments`     | [自定义图标](https://fontawesome.com/v4/icons/) |
| **图标大小**   | `17px`               | 保持默认                                        |
| **提示**       | `AI 助手`            | 鼠标悬停显示的文字                              |
| **自定义回调** | *(见下方代码)*       | **核心配置**                                    |

**请在“自定义回调”框中，完整复制并粘贴以下代码：**

JavaScript

```
() => {
    const plugin = this.utils.getCustomPlugin("typoraCopilot");
    if (!plugin) {
        alert("❌ 调用失败：未找到 typoraCopilot 插件！\n请检查 plugin/custom/plugins/ 下是否有 typoraCopilot.js 文件");
        return;
    }
    plugin.callback();
}
```

1. 点击 **“确定”** 保存即可生效。

## 📖 使用指南

### 界面交互

1. **切换模型**：点击标题栏左侧的下拉菜单，即时切换不同的 AI 模型配置。
2. **引用模式**：
   - **🚫 无引用**：最省钱，仅发送当前输入的问题。
   - **📄 全文引用**：点击按钮开启。AI 将读取当前文档内容（截取至 `max_context` 长度）作为参考。
   - **📝 选区引用**：在文档中**选中一段话**，唤醒助手。输入框会自动提示“已检测到选区”，此时 AI 将专门针对这段文字进行处理。
3. **结果处理**：
   - **📥 插入**：将 AI 回复直接插入到文档光标位置。
   - **📋 复制 MD**：复制 AI 回复的 Markdown 源码。

### 常见问题 (FAQ)

**Q: 点击悬浮窗报错 `plugin is null`？**

A: 说明插件未正确加载。请检查 `plugin/custom/plugins/` 目录下是否有 `typoraCopilot.js` 文件，且文件名大小写完全一致。

**Q: 报错 429 Too Many Requests？**

A: 这通常意味着当前模型的 API Key 余额不足或并发超限。请在顶部下拉菜单中切换到免费版模型（如 Flash），或检查 API 余额。

**Q: 其他报错？**

A: 在Typora界面，按`shift+F12`，调出开发者工具，根据日志来解决（可复制日志给AI来分析）。


## 📝 License

MIT License