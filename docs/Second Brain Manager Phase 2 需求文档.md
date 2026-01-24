# PRD - Second Brain Manager Phase 2：AI 基础设施与对话连通性

## 一、 项目变更说明

### 1.1 项目更名

- **原名称**：Inbox Manager
- **新名称**：Second Brain Manager
- **变更理由**：为了承载除 Inbox 自动整理外更多的“第二大脑”管理功能（如知识关联、内容增强、自动化工作流等），提升插件的扩展性。

### 1.2 第二期愿景

第二期的核心目标是“打通基建”。我们需要在插件内部建立起一套稳定的 AI 调用机制，并提供一个可视化的对话窗口，用于验证 API 配置的正确性以及 AI 对话的连通性。

## 二、 技术架构方案

### 2.1 核心框架：Vercel AI SDK

- **选型原因**：Vercel AI SDK 提供了强大的流式传输支持和统一的 API 抽象层，能够极大简化 Obsidian 环境下与不同 LLM 供应商（OpenAI, Anthropic, DeepSeek 等）的集成工作。
- **集成方式**：
  - 使用 `ai` 包处理流式响应。
  - 前端优先考虑适配 Vercel AI SDK 的 React 组件模式。

### 2.2 前端执行框架

- **UI 规范**：严格遵循 [[ui ux pro max]] 中的设计准则。
- **技术栈**：如果 Obsidian 环境允许，优先使用 Vercel AI 的前端 Hooks（如 `useChat`）来管理对话状态。

## 三、 核心功能需求

### 3.1 AI 配置管理 (Settings)

用户需要在插件设置面板中配置以下三个核心参数：
1. **API Key**：加密存储用户的身份密钥。
2. **Base URL**：支持自定义中转地址（如 OpenRouter, OneAPI 或自建代理）。
3. **Model Name**：用户手动输入或从预设列表中选择的模型标识（如 `gpt-4o`, `claude-3-5-sonnet`, `deepseek-chat`）。

### 3.2 极简对话测试窗口 (Chat Interface)

建立一个位于侧边栏（Right Ribbon）的极简对话面板：
- **输入框**：支持多行文本输入，按 `Enter` 发送（`Shift + Enter` 换行）。
- **消息列表**：清晰区分“用户消息”和“AI 回复”。
- **状态反馈**：
  - **连接中**：发送请求时的 Loading 状态。
  - **连通成功**：AI 正常流式输出。
  - **报错提示**：如果 API Key 错误或网络不通，需弹出明确的错误提示。

## 四、 交互设计 (UX)

- **入口**：在 Obsidian 侧边栏增加一个“大脑”图标。
- **界面风格**：保持与 Obsidian 原生 UI 高度一致。
- **连通性校验**：在设置页面提供一个 "Test Connection" 按钮。

## 五、 关联文档

- 第一期构思：[[Obsidian 插件构思：AI 第二大脑 Inbox 自动整理]]
- 视觉参考：[[ui ux pro max]]
