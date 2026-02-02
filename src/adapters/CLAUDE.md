# Adapters Module

[根目录](../../CLAUDE.md) > [src](../) > **adapters**

## 变更记录 (Changelog)

### 2026-01-27
- 更新接口文档（新增文件监听、打开文件等接口）
- 补充 ObsAdapter 实现细节（文件监听、标签获取）
- 更新 WebAdapter Mock 数据

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
  // 文件操作
  loadInboxFiles(inboxPath: string): Promise<FileMetadata[]>;
  moveFile(path: string, targetPath: string): Promise<void>;
  updateFrontmatter(path: string, data: Record<string, any>): Promise<void>;

  // PARA AI 分析支持
  getAllTags(): string[];
  getFolderTree(): string;
  getAllFolders(): string[];

  // 文件监听
  onInboxChange(inboxPath: string, callback: () => void): () => void;

  // 打开文件
  openFile(path: string): void;
}

export interface FileMetadata {
  path: string;      // 文件相对路径
  name: string;      // 文件名
  content: string;   // 文件完整内容
}

export interface FolderSuggestion {
  folder: string;
  reason: string;
  isNew?: boolean;  // 是否是新文件夹
}

export interface OrganizationSuggestion {
  path: string;
  folderSuggestions: FolderSuggestion[];
  selectedFolderIndex: number;
  tags: string[];
  newTags?: string[];
  area?: string;
  targetFolder?: string;  // Legacy field for compatibility
  reason?: string;
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
| `getAllTags` | - | `string[]` | 获取 Vault 中所有标签（如 ['#work', '#todo']） |
| `getFolderTree` | - | `string` | 获取文件夹树结构（Markdown 格式） |
| `getAllFolders` | - | `string[]` | 获取所有文件夹路径列表 |
| `onInboxChange` | `inboxPath: string, callback: () => void` | `() => void` | 监听 Inbox 文件夹变化，返回取消监听函数 |
| `openFile` | `path: string` | `void` | 打开文件（类似双链点击效果） |

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

// 获取所有标签
const tags = adapter.getAllTags();
// 返回：['#meeting', '#project', '#todo']

// 获取文件夹树
const tree = adapter.getFolderTree();
// 返回："- Projects/\n  - Alpha/\n- Areas/"

// 监听文件变化
const unsubscribe = adapter.onInboxChange('Inbox', () => {
  console.log('Inbox changed!');
});
// 取消监听
unsubscribe();

// 打开文件
adapter.openFile('Projects/Alpha/Note1.md');
```

---

## 关键依赖与配置

### ObsAdapter 依赖

```typescript
import { App, TFile, normalizePath } from 'obsidian';
import { Utils } from '../tools/ObsidianTools';
```

- **App**：Obsidian 核心应用实例
- **TFile**：文件对象类型
- **normalizePath**：路径规范化工具
- **Utils**：工具类（获取标签、文件夹树）

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
  path: string;                      // 源文件路径
  folderSuggestions: FolderSuggestion[];  // 3 个文件夹选项
  selectedFolderIndex: number;       // 当前选中的索引（0-2）
  tags: string[];                    // 推荐标签
  newTags?: string[];                // 仅包含新创建的标签
  area?: string;                     // PARA Area（可选）
  targetFolder?: string;             // Legacy 字段（兼容性）
  reason?: string;                   // AI 推理说明
}

interface FolderSuggestion {
  folder: string;    // 完整路径（如 "Projects/Alpha"）
  reason: string;    // 推荐理由
  isNew?: boolean;   // 是否是新文件夹
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

  it('should return mock tags', () => {
    const adapter = new WebAdapter();
    const tags = adapter.getAllTags();
    expect(tags).toContain('#project');
    expect(tags).toContain('#personal');
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

  it('should handle file moving', async () => {
    const mockApp = createMockApp();
    const adapter = new ObsAdapter(mockApp);
    await adapter.moveFile('Inbox/test.md', 'Projects/test.md');
    expect(mockApp.vault.renameFile).toHaveBeenCalled();
  });

  it('should merge tags correctly', async () => {
    const mockApp = createMockApp({
      frontmatter: { tags: ['#existing'] }
    });
    const adapter = new ObsAdapter(mockApp);
    await adapter.updateFrontmatter('test.md', {
      tags: ['#new', '#another']
    });
    // 验证标签合并：['#existing', '#new', '#another']
  });
});
```

### 集成测试建议

- 使用 `vitest` + `@testing-library/react` 测试 UI 组件与适配器交互
- Mock Obsidian API（使用 `jest.mock('obsidian')`）
- 测试文件监听功能（模拟文件创建/删除/重命名）

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
          if (key === 'tags') {
            // 处理标签合并
            const newTags = Array.isArray(value) ? value : [value];
            const existingTags = frontmatter['tags'];

            let mergedTags: string[] = [];
            if (Array.isArray(existingTags)) {
              mergedTags = [...existingTags];
            } else if (typeof existingTags === 'string') {
              mergedTags = [existingTags];
            }

            // 添加不重复的标签
            for (const tag of newTags) {
              if (!mergedTags.includes(tag)) {
                mergedTags.push(tag);
              }
            }

            frontmatter['tags'] = mergedTags;
          } else {
            // 其他字段直接覆盖
            frontmatter[key] = value;
          }
        }
      }
    });
  }
}
```

**注意**：
- 使用 `processFrontMatter` 确保格式正确（YAML 语法）
- 标签字段特殊处理：合并而非覆盖
- 只更新 `value !== undefined` 的字段（保留 `null` 和 `false` 值）

#### 获取标签和文件夹

```typescript
getAllTags(): string[] {
  return Utils.getAllTags(this.app);
}

getFolderTree(): string {
  return Utils.getFolderTree(this.app);
}

getAllFolders(): string[] {
  return Utils.getAllFolders(this.app);
}
```

**委托给工具类**：
- `Utils.getAllTags()`：从 `metadataCache` 提取所有标签
- `Utils.getFolderTree()`：遍历文件夹树生成 Markdown
- `Utils.getAllFolders()`：获取所有文件夹路径

#### 文件监听

```typescript
onInboxChange(inboxPath: string, callback: () => void): () => void {
  const normalizedPath = inboxPath.endsWith('/') ? inboxPath : inboxPath + '/';

  // 检查文件是否在 Inbox 中
  const isInInbox = (path: string) => path.startsWith(normalizedPath) || path === inboxPath;

  // 注册事件处理器
  const createRef = this.app.vault.on('create', (file) => {
    if (file instanceof TFile && isInInbox(file.path)) {
      callback();
    }
  });

  const deleteRef = this.app.vault.on('delete', (file) => {
    if (file instanceof TFile && isInInbox(file.path)) {
      callback();
    }
  });

  const renameRef = this.app.vault.on('rename', (file, oldPath) => {
    if (file instanceof TFile && (isInInbox(file.path) || isInInbox(oldPath))) {
      callback();
    }
  });

  // 返回取消监听函数
  return () => {
    this.app.vault.offref(createRef);
    this.app.vault.offref(deleteRef);
    this.app.vault.offref(renameRef);
  };
}
```

**注意**：
- 监听三种事件：`create`（新建）、`delete`（删除）、`rename`（重命名）
- 使用 `vault.on()` 注册，`vault.offref()` 取消
- `rename` 事件需检查新旧路径（可能从 Inbox 移出，或移入 Inbox）
- 返回取消函数（用于 `useEffect` 清理）

#### 打开文件

```typescript
openFile(path: string): void {
  this.app.workspace.openLinkText(path, '', false);
}
```

**效果**：与双链点击一致（在新窗格中打开文件）

### WebAdapter Mock 策略

```typescript
async loadInboxFiles(inboxPath: string): Promise<FileMetadata[]> {
  console.log(`[Mock] Loading files from ${inboxPath}`);
  return [
    { path: 'Inbox/Note1.md', name: 'Note1.md', content: 'Meeting notes about project Alpha' },
    { path: 'Inbox/Idea.md', name: 'Idea.md', content: 'Buy milk and eggs' }
  ];
}

getAllTags(): string[] {
  console.log('[Mock] Getting all tags');
  return ['#project', '#personal', '#work', '#todo', '#reference', '#archive', '#meeting', '#idea'];
}

getFolderTree(): string {
  console.log('[Mock] Getting folder tree');
  return `- 1. Projects/
  - Project-Alpha/
  - Project-Beta/
- 2. Areas/
  - Work/
  - Personal/
  - Health/
- 3. Resources/
  - Notes/
  - Templates/
  - References/
- 4. Archive/
  - 2024/
  - 2025/`;
}

getAllFolders(): string[] {
  return [
    '1. Projects',
    '1. Projects/Project-Alpha',
    '1. Projects/Project-Beta',
    '2. Areas',
    '2. Areas/Work',
    '2. Areas/Personal',
    '3. Resources',
    '3. Resources/Notes',
    '3. Resources/Templates',
    '4. Archive',
    '4. Archive/2024',
    '4. Archive/2025'
  ];
}

onInboxChange(inboxPath: string, callback: () => void): () => void {
  // Web adapter 不支持实时文件监听
  return () => {};
}

openFile(path: string): void {
  console.log(`[Mock] Would open file: ${path}`);
}
```

**设计考虑**：
- 返回固定数据便于 UI 开发
- 模拟真实场景（不同类型的内容：工作 vs 个人）
- 文件夹树符合 PARA 方法论（Projects, Areas, Resources, Archive）

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

**Q: 文件监听会影响性能吗？**
A: 不会。Obsidian 的 `vault.on()` 是原生事件监听，性能开销极小。

**Q: 如何实现跨平台路径兼容？**
A: 使用 Obsidian 提供的 `normalizePath()` 函数，自动处理 Windows/Mac/Linux 路径差异。

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

4. **事件增强**：
   - 支持监听单个文件变化
   - 支持监听文件夹变化（子文件夹）

5. **测试适配器**：
   - 实现 `TestAdapter` 用于自动化测试
   - 支持预设场景数据

6. **Web 端真实文件操作**：
   - 使用 File System Access API
   - 支持拖拽上传文件

---

*文档生成时间：2026-01-27 21:35:33*
