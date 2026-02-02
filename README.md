# Stonework AI: Inbox

[English](#english) | [中文](#中文)

---

## English

### Overview

Stonework AI: Inbox is an AI-powered Obsidian plugin that helps you automatically organize your notes. It analyzes the content of files in your Inbox folder and provides intelligent classification suggestions based on the PARA methodology (Projects, Areas, Resources, Archives).

### Features

- **AI-Powered Classification**: Automatically analyzes note content and suggests appropriate folders
- **Smart Tag Recommendations**: Suggests relevant tags based on content, highlighting new vs existing tags
- **Manual Override**: Choose your own target folder when AI suggestions don't fit
- **AI Chat Assistant**: Built-in chat interface for knowledge base Q&A
- **Real-time Monitoring**: Automatically refreshes when files change in the Inbox
- **Multi-language Support**: Interface available in English and Chinese

### Installation

1. Download the latest release from the releases page
2. Extract the files to your vault's `.obsidian/plugins/stonework-ai-inbox/` folder
3. Reload Obsidian
4. Enable "Stonework AI: Inbox" in Settings > Community Plugins

### Configuration

1. Go to Settings > Stonework AI: Inbox
2. Configure your AI provider:
   - **API Key**: Your OpenRouter or OpenAI API key
   - **Base URL**: Custom API endpoint (leave empty for OpenAI default)
   - **Model Name**: The model to use (e.g., `deepseek/deepseek-chat`, `gpt-4o`)
3. Set your **Inbox Path** (default: `Inbox`)
4. Choose your preferred **Language**

### Usage

1. Click the archive icon in the ribbon or use the command palette (`Ctrl+P` > "Open inbox organizer")
2. Click "Scan all with AI" to analyze all files in your Inbox
3. Review the AI suggestions for each file:
   - Select a target folder from AI recommendations, or choose manually
   - Edit tags as needed
   - Click "Accept" to move the file, or "Ignore" to skip
4. Use the chat assistant (bot icon) for Q&A about your knowledge base

### Network Usage Disclosure

**This plugin makes network requests to external AI services.**

When you use the AI classification or chat features, this plugin sends:
- The content of your notes (only those in the Inbox folder being analyzed)
- Your vault's folder structure (for folder recommendations)
- Your vault's existing tags (for tag recommendations)

This data is sent to the AI provider you configure (e.g., OpenRouter, OpenAI). Please review your AI provider's privacy policy and terms of service.

**No data is collected or stored by the plugin author.**

### License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

## 中文

### 概述

Stonework AI: Inbox 是一个 AI 驱动的 Obsidian 插件，帮助你自动整理笔记。它会分析 Inbox 文件夹中的文件内容，并基于 PARA 方法论（Projects、Areas、Resources、Archives）提供智能分类建议。

### 功能特性

- **AI 智能分类**：自动分析笔记内容并建议合适的目标文件夹
- **智能标签推荐**：根据内容推荐相关标签，区分新增和已有标签
- **手动覆盖**：当 AI 建议不合适时，可以手动选择目标文件夹
- **AI 聊天助手**：内置聊天界面，支持知识库问答
- **实时监听**：Inbox 文件变化时自动刷新
- **多语言支持**：界面支持中英文切换

### 安装

1. 从 releases 页面下载最新版本
2. 将文件解压到你的 vault 的 `.obsidian/plugins/stonework-ai-inbox/` 文件夹
3. 重新加载 Obsidian
4. 在 设置 > 社区插件 中启用 "Stonework AI: Inbox"

### 配置

1. 进入 设置 > Stonework AI: Inbox
2. 配置 AI 服务：
   - **API Key**：你的 OpenRouter 或 OpenAI API 密钥
   - **Base URL**：自定义 API 端点（留空使用 OpenAI 默认值）
   - **Model Name**：使用的模型（如 `deepseek/deepseek-chat`、`gpt-4o`）
3. 设置 **Inbox 路径**（默认：`Inbox`）
4. 选择你偏好的**语言**

### 使用方法

1. 点击侧边栏的归档图标，或使用命令面板（`Ctrl+P` > "Open inbox organizer"）
2. 点击 "Scan all with AI" 分析 Inbox 中的所有文件
3. 查看每个文件的 AI 建议：
   - 从 AI 推荐中选择目标文件夹，或手动选择
   - 根据需要编辑标签
   - 点击 "Accept" 移动文件，或 "Ignore" 跳过
4. 使用聊天助手（机器人图标）进行知识库问答

### 网络使用声明

**本插件会向外部 AI 服务发送网络请求。**

当你使用 AI 分类或聊天功能时，本插件会发送：
- 你的笔记内容（仅限被分析的 Inbox 文件夹中的文件）
- 你的 vault 文件夹结构（用于文件夹推荐）
- 你的 vault 已有标签（用于标签推荐）

这些数据会发送到你配置的 AI 服务提供商（如 OpenRouter、OpenAI）。请查阅你所使用的 AI 服务提供商的隐私政策和服务条款。

**插件作者不会收集或存储任何数据。**

### 许可证

本项目采用 AGPL-3.0 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## Support

- Report issues: [GitHub Issues](https://github.com/air-yan/stonework-ai-inbox/issues)
- Feature requests: [GitHub Discussions](https://github.com/air-yan/stonework-ai-inbox/discussions)
