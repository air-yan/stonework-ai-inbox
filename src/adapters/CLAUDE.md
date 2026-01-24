# Adapters Module

[根目录](../../CLAUDE.md) > [src](../) > **adapters**

## 变更记录 (Changelog)

### 2026-01-17
- 初始化模块文档
- 完成接口定义与双端实现分析

---

## 模块职责

**适配器模块**是项目的数据层抽象，负责隔离 Obsidian API 与业务逻辑。通过定义统一的 `DataProvider` 接口，实现双端适配：

- **ObsAdapter**：在 Obsidian 插件环境中，使用真实 Vault API 操作文件
- **WebAdapter**：在浏览器开发环境中，使用 Mock 数据模拟文件操作

这种设计使得 React UI 组件完全无需关心底层实现，极大提升了可测试性与开发效率。

---

## 入口与启动

### 核心接口

```typescript
// types.ts - 数据提供者接口
export interface DataProvider {
  loadInboxFiles(inboxPath: string): Promise<FileMetadata[]>;
  moveFile(path: string, targetPath: string): Promise<void>;
  updateFrontmatter(path: string, data: Record<string, any>): Promise<void>;
}

export interface FileMetadata {
  path: string;      // 文件相对路径
  name: string;      // 文件名
  content: string;   // 文件完整内容
}

export interface OrganizationSuggestion {
  path: string;          // 源文件路径
  targetFolder: string;  // 目标文件夹
  tags: string[];        // 推荐标签
  area?: string;         // PARA Area 属性
  reason?: string;       // AI 推理说明
}
```

### 适配器实例化

```typescript
// Web 环境（web-entry.tsx）
import { WebAdapter } from './adapters/WebAdapter';
root.render(<InboxView adapter={new WebAdapter()} />);

// Obsidian 环境（main.ts）
import { ObsAdapter } from './adapters/ObsAdapter';
root.render(<InboxView adapter={new ObsAdapter(this.app)} />);
```

---

## 对外接口

### DataProvider 接口详解

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `loadInboxFiles` | `inboxPath: string` | `Promise<FileMetadata[]>` | 读取指定文件夹下所有 Markdown 文件 |
| `moveFile` | `path: string, targetPath: string` | `Promise<void>` | 移动文件到目标位置（自动创建父目录） |
| `updateFrontmatter` | `path: string, data: Record<string, any>` | `Promise<void>` | 更新文件的 Frontmatter 元数据 |

### 使用示例

```typescript
// 读取 Inbox 文件
const files = await adapter.loadInboxFiles('Inbox');
// 返回：[{ path: 'Inbox/Note1.md', name: 'Note1.md', content: '...' }]

// 移动文件
await adapter.moveFile('Inbox/Note1.md', 'Projects/Alpha/Note1.md');

// 更新元数据
await adapter.updateFrontmatter('Projects/Alpha/Note1.md', {
  tags: ['#work', '#todo'],
  area: 'Project Alpha'
});
```

---

## 关键依赖与配置

### ObsAdapter 依赖

```typescript
import { App, TFile, normalizePath } from 'obsidian';
```

- **App**：Obsidian 核心应用实例
- **TFile**：文件对象类型
- **normalizePath**：路径规范化工具

### 配置要求

**ObsAdapter**：
- 需要传入 `App` 实例（由 Obsidian 插件系统提供）
- 依赖插件设置中的 `inboxPath` 配置

**WebAdapter**：
- 无需配置，硬编码返回 Mock 数据
- 适用于快速 UI 开发与测试

---

## 数据模型

### FileMetadata

```typescript
interface FileMetadata {
  path: string;      // 示例: "Inbox/Meeting.md"
  name: string;      // 示例: "Meeting.md"
  content: string;   // 完整 Markdown 内容
}
```

### OrganizationSuggestion

```typescript
interface OrganizationSuggestion {
  path: string;          // 源文件路径
  targetFolder: string;  // 示例: "2. Areas/Projects"
  tags: string[];        // 示例: ["#work", "#meeting"]
  area?: string;         // 可选: "Project Alpha"
  reason?: string;       // AI 推理: "Contains project keywords"
}
```

---

## 测试与质量

**当前状态**：无自动化测试

**建议补充**：

### 单元测试示例

```typescript
// 测试 WebAdapter
describe('WebAdapter', () => {
  it('should return mock files', async () => {
    const adapter = new WebAdapter();
    const files = await adapter.loadInboxFiles('Inbox');
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('Inbox/Note1.md');
  });
});

// 测试 ObsAdapter（需 Mock Obsidian API）
describe('ObsAdapter', () => {
  it('should load files from vault', async () => {
    const mockApp = createMockApp();
    const adapter = new ObsAdapter(mockApp);
    const files = await adapter.loadInboxFiles('Inbox');
    expect(files.length).toBeGreaterThan(0);
  });
});
```

### 集成测试建议

- 使用 `vitest` + `@testing-library/react` 测试 UI 组件与适配器交互
- Mock Obsidian API（使用 `jest.mock('obsidian')`）

---

## 实现细节

### ObsAdapter 核心逻辑

#### 文件加载

```typescript
async loadInboxFiles(inboxPath: string): Promise<FileMetadata[]> {
  const folder = this.app.vault.getAbstractFileByPath(normalizePath(inboxPath));
  if (!folder) {
    console.warn(`Inbox folder '${inboxPath}' not found`);
    return [];
  }

  const files = this.app.vault.getMarkdownFiles()
    .filter(file => file.path.startsWith(normalizePath(inboxPath)));

  const metadataList: FileMetadata[] = [];
  for (const file of files) {
    const content = await this.app.vault.read(file);
    metadataList.push({ path: file.path, name: file.name, content });
  }
  return metadataList;
}
```

**注意**：
- 使用 `normalizePath` 确保跨平台兼容性（Windows/Mac/Linux）
- 过滤条件：文件路径以 `inboxPath` 开头
- 读取完整文件内容用于 AI 分析

#### 文件移动

```typescript
async moveFile(path: string, targetPath: string): Promise<void> {
  const file = this.app.vault.getAbstractFileByPath(path);
  if (file instanceof TFile) {
    // 自动创建目标目录
    const targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
    if (targetDir && !this.app.vault.getAbstractFileByPath(targetDir)) {
      await this.app.vault.createFolder(targetDir);
    }
    await this.app.fileManager.renameFile(file, normalizePath(targetPath));
  }
}
```

**注意**：
- 需要先检查目标目录是否存在，不存在则创建
- 使用 `fileManager.renameFile` 而非直接操作文件系统

#### 元数据更新

```typescript
async updateFrontmatter(path: string, data: Record<string, any>): Promise<void> {
  const file = this.app.vault.getAbstractFileByPath(path);
  if (file instanceof TFile) {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          frontmatter[key] = value;
        }
      }
    });
  }
}
```

**注意**：
- 使用 `processFrontMatter` 确保格式正确（YAML 语法）
- 只更新 `value !== undefined` 的字段（保留 `null` 和 `false` 值）

### WebAdapter Mock 策略

```typescript
async loadInboxFiles(inboxPath: string): Promise<FileMetadata[]> {
  console.log(`[Mock] Loading files from ${inboxPath}`);
  return [
    { path: 'Inbox/Note1.md', name: 'Note1.md', content: 'Meeting notes about project Alpha' },
    { path: 'Inbox/Idea.md', name: 'Idea.md', content: 'Buy milk and eggs' }
  ];
}
```

**设计考虑**：
- 返回固定数据便于 UI 开发
- 模拟真实场景（不同类型的内容：工作 vs 个人）

---

## 常见问题 (FAQ)

**Q: 为什么需要适配器模式？**
A: 为了在浏览器中快速开发 UI，无需每次改动都重载 Obsidian 插件。通过适配器，同一套 React 组件可以在两个环境中运行。

**Q: ObsAdapter 如何处理文件夹不存在的情况？**
A: `moveFile` 方法会自动检查目标目录，不存在则调用 `vault.createFolder()` 创建。

**Q: WebAdapter 的 Mock 数据可以自定义吗？**
A: 可以修改 `WebAdapter.ts` 中的返回值，或者实现从本地 JSON 文件读取数据。

**Q: 支持哪些文件格式？**
A: 当前只支持 Markdown 文件（`.md`），因为使用 `vault.getMarkdownFiles()` 过滤。

---

## 相关文件清单

```
src/adapters/
├── types.ts          # 接口定义（DataProvider、FileMetadata 等）
├── ObsAdapter.ts     # Obsidian 真实实现
├── WebAdapter.ts     # Web Mock 实现
├── types.js          # 编译产物
├── ObsAdapter.js     # 编译产物
└── WebAdapter.js     # 编译产物
```

---

## 扩展建议

### 未来增强方向

1. **多格式支持**：
   - 添加对 PDF、图片等文件的支持
   - 读取文件元数据（创建时间、标签等）

2. **缓存优化**：
   - 实现内存缓存，避免重复读取文件
   - 使用 Map 存储已加载的文件内容

3. **批量操作**：
   - 添加 `batchMoveFiles()` 方法
   - 添加事务支持（失败回滚）

4. **事件监听**：
   - 监听文件变化（新建、修改、删除）
   - 实时刷新 UI

5. **测试适配器**：
   - 实现 `TestAdapter` 用于自动化测试
   - 支持预设场景数据

---

*文档生成时间：2026-01-17 19:27:29*
