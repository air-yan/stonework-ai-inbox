# 设计文档: Obsidian Inbox 自动整理插件

- **日期**: 2026-01-17
- **状态**: 已确认 (Validated)
- **作者**: Antigravity

## 1. 概述 (Overview)

开发一个 Obsidian 插件，利用 AI 自动治理 "Inbox" 文件夹。插件通过扫描 Inbox 路径下的文件，调用 LLM 生成结构化的分类建议（目标文件夹、标签、Area 归属），并提供一个全屏的交互式表格供用户审核与执行。

## 2. 关键决策 (Key Decisions)

在头脑风暴阶段确认了以下核心方向：

- **API 策略**: **独立配置模式 (Independent Configuration)**。插件内部实现 API Key 和 Base URL 配置界面，支持 OpenAI 兼容接口，确保最大的服务商兼容性（OpenAI, DeepSeek, Moonshot 等）。
- **UI 交互**: **整页视图 (Full Page / ItemView)**。为了容纳多列元数据（文件名、路径、标签、操作），采用占用中央编辑区的整页表格设计，提供沉浸式的整理体验。
- **架构模式**: **Web-First (React + Adapter)**。采用适配器模式解耦 UI 与 Obsidian API，90% 的开发工作在浏览器中完成，通过 Mock 数据驱动。

## 3. 详细设计 (Detailed Design)

### 3.1 系统架构 (System Architecture)

遵循 `docs/obsidian开发方式.md` 中定义的 Web-First 架构。

```mermaid
graph TD
    User[用户] --> UI[InboxView (React)]
    UI --> Service[整理服务 (OrganizationService)]
    UI --> Settings[设置服务 (SettingsService)]
    
    subgraph Core [核心逻辑]
        Service --> LLM[LLM Client (OpenAI API)]
        Service --> Data[DataProvider (Adapter)]
    end
    
    subgraph Adapters [适配器层]
        Data -- 浏览器开发 --> WebAdapter[WebAdapter (Mock)]
        Data -- 生产环境 --> ObsAdapter[ObsAdapter (Obsidian API)]
    end
    
    ObsAdapter --> Vault[Obsidian Vault]
```

### 3.2 模块设计

#### A. 配置与数据接口 (Types)
-定义的通用接口 `DataProvider`，包含：
    - `loadFiles(path: string): Promise<TFile[]>`
    - `moveFile(file: TFile, targetPath: string): Promise<void>`
    - `updateFrontmatter(file: TFile, data: any): Promise<void>`

#### B. LLM 服务 (LlmService)
- 负责构建 Prompt，要求 LLM 返回严格的 JSON 格式。
- 输入：文件列表及内容摘要。
- 输出：
  ```json
  [
    {
      "filename": "example.md",
      "targetFolder": "2. Areas/ProjectA",
      "tags": ["#tag1"],
      "area": "ProjectA",
      "reason": "Content matches project A context"
    }
  ]
  ```

#### C. UI 组件 (UI Components)
- `InboxView`: 主容器，负责状态管理。
- `OrganizationalTable`: 核心组件，展示扫描结果。
  - 列：文件名 | 建议路径 | 建议标签 | Area | 操作 (移动/忽略/修改)
- `SettingsForm`: 配置 API Key、Base URL、Inbox 路径。

### 3.3 目录结构 (Directory Structure)

```text
src/
├── adapters/         # 适配器
│   ├── types.ts      
│   ├── WebAdapter.ts 
│   └── ObsAdapter.ts 
├── components/       # UI 组件
│   ├── OrganizationalTable.tsx
│   └── SettingsForm.tsx
├── services/         # 业务逻辑
│   ├── LlmService.ts
│   └── OrganizationService.ts
├── views/            # 视图容器
│   └── InboxView.tsx
├── main.ts           # Obsidian 入口
└── web-entry.tsx     # Web 入口
```

## 4. 验证计划 (Verification Plan)

### 4.1 自动化测试 (Web 环境)
- 运行 `npm run dev` 启动浏览器开发环境。
- 验证 Mock 数据能否正确渲染表格。
- 验证 API Key 输入能否保存（模拟）。

### 4.2 手动集成测试 (Obsidian 环境)
- 运行 `npm run dev:plugin` 构建并在 Obsidian 中加载。
- 配置真实的 API Key 和 Inbox 路径。
- 放入测试文件到 Inbox。
- 点击“一键整理”，验证文件是否被物理移动，且 Frontmatter 是否被修改。
