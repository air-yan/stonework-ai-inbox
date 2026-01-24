# Components Module

[根目录](../../CLAUDE.md) > [src](../) > **components**

## 变更记录 (Changelog)

### 2026-01-17
- 初始化模块文档
- 分析 UI 组件实现与样式管理

---

## 模块职责

**组件模块**是 React 应用的纯 UI 层，负责可视化展示与用户交互。目前包含：

- **SettingsForm**：插件设置表单（API Key、Base URL、Inbox 路径）
- **OrganizationalTable**：文件整理建议表格（展示、接受、忽略）

### 设计原则

1. **纯函数组件**：无副作用，输入 Props → 输出 UI
2. **无业务逻辑**：只负责展示与事件回调，不处理数据
3. **可复用性**：通过 Props 接口实现灵活配置
4. **样式隔离**：使用内联样式（待迁移到 CSS）

---

## 入口与启动

### SettingsForm 组件

```typescript
export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialApiKey,
  initialBaseUrl,
  initialInboxPath,
  onSave
}) => {
  // 表单状态
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [baseURL, setBaseURL] = useState(initialBaseUrl);
  const [inboxPath, setInboxPath] = useState(initialInboxPath);

  // 提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiKey, baseURL, inboxPath });
  };

  // 渲染表单
  return (/* ... */);
};
```

### OrganizationalTable 组件

```typescript
export const OrganizationalTable: React.FC<OrganizationalTableProps> = ({
  files,
  suggestions,
  onMove,
  onIgnore
}) => {
  const getSuggestion = (path: string) =>
    suggestions.find(s => s.path === path);

  return (
    <table>
      <thead> {/* ... */} </thead>
      <tbody>
        {files.map(file => {
          const suggestion = getSuggestion(file.path);
          return <tr key={file.path}> {/* ... */} </tr>;
        })}
      </tbody>
    </table>
  );
};
```

---

## 对外接口

### SettingsForm Props

```typescript
interface SettingsFormProps {
  initialApiKey?: string;      // 初始 API Key
  initialBaseUrl?: string;     // 初始 Base URL
  initialInboxPath?: string;   // 初始 Inbox 路径（默认 "Inbox"）
  onSave: (config: {
    apiKey: string;
    baseURL: string;
    inboxPath: string;
  }) => void;                  // 保存回调
}
```

### OrganizationalTable Props

```typescript
interface OrganizationalTableProps {
  files: FileMetadata[];                    // 文件列表
  suggestions: OrganizationSuggestion[];    // AI 建议列表
  onMove: (path: string, suggestion: OrganizationSuggestion) => void;  // 接受回调
  onIgnore: (path: string) => void;         // 忽略回调
}
```

---

## 关键依赖与配置

### 外部依赖

```typescript
import React, { useState } from 'react';
import { OrganizationSuggestion, FileMetadata } from '../adapters/types';
```

### 配置要求

**无需配置**：所有配置通过 Props 传递

---

## 数据模型

### 输入数据

**SettingsForm**：
```typescript
initialApiKey: string      // 示例: "sk-..."
initialBaseUrl: string     // 示例: "https://api.openai.com/v1"
initialInboxPath: string   // 示例: "Inbox"
```

**OrganizationalTable**：
```typescript
files: FileMetadata[]  // 文件元数据列表
suggestions: OrganizationSuggestion[]  // 分类建议列表
```

### 输出事件

**SettingsForm**：
```typescript
onSave(config: {
  apiKey: string;      // 保存后的 API Key
  baseURL: string;     // 保存后的 Base URL
  inboxPath: string;   // 保存后的 Inbox 路径
})
```

**OrganizationalTable**：
```typescript
onMove(path: string, suggestion: OrganizationSuggestion)  // 点击"Accept"
onIgnore(path: string)  // 点击"Ignore"
```

---

## 测试与质量

**当前状态**：无自动化测试

**建议补充**：

### SettingsForm 测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsForm } from './SettingsForm';

describe('SettingsForm', () => {
  it('should render initial values', () => {
    render(
      <SettingsForm
        initialApiKey="sk-test"
        initialBaseUrl="https://api.test.com"
        initialInboxPath="CustomInbox"
        onSave={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue('sk-test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://api.test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CustomInbox')).toBeInTheDocument();
  });

  it('should call onSave with form values', () => {
    const onSave = jest.fn();
    render(
      <SettingsForm
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('sk-...'), {
      target: { value: 'sk-new-key' }
    });
    fireEvent.click(screen.getByText('Save Configuration'));

    expect(onSave).toHaveBeenCalledWith({
      apiKey: 'sk-new-key',
      baseURL: '',
      inboxPath: 'Inbox'
    });
  });

  it('should handle password input type', () => {
    render(<SettingsForm onSave={jest.fn()} />);

    const apiKeyInput = screen.getByPlaceholderText('sk-...');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });
});
```

### OrganizationalTable 测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OrganizationalTable } from './OrganizationalTable';

describe('OrganizationalTable', () => {
  const files = [
    { path: 'Inbox/Note1.md', name: 'Note1.md', content: 'test' }
  ];

  const suggestions = [
    {
      path: 'Inbox/Note1.md',
      targetFolder: 'Projects/Alpha',
      tags: ['#work'],
      reason: 'Test'
    }
  ];

  it('should render files and suggestions', () => {
    const onMove = jest.fn();
    const onIgnore = jest.fn();

    render(
      <OrganizationalTable
        files={files}
        suggestions={suggestions}
        onMove={onMove}
        onIgnore={onIgnore}
      />
    );

    expect(screen.getByText('Note1.md')).toBeInTheDocument();
    expect(screen.getByText('Projects/Alpha')).toBeInTheDocument();
    expect(screen.getByText('#work')).toBeInTheDocument();
  });

  it('should call onMove when Accept clicked', () => {
    const onMove = jest.fn();

    render(
      <OrganizationalTable
        files={files}
        suggestions={suggestions}
        onMove={onMove}
        onIgnore={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Accept'));
    expect(onMove).toHaveBeenCalledWith('Inbox/Note1.md', suggestions[0]);
  });

  it('should call onIgnore when Ignore clicked', () => {
    const onIgnore = jest.fn();

    render(
      <OrganizationalTable
        files={files}
        suggestions={suggestions}
        onMove={jest.fn()}
        onIgnore={onIgnore}
      />
    );

    fireEvent.click(screen.getByText('Ignore'));
    expect(onIgnore).toHaveBeenCalledWith('Inbox/Note1.md');
  });

  it('should show Analyzing when no suggestion', () => {
    render(
      <OrganizationalTable
        files={files}
        suggestions={[]}
        onMove={jest.fn()}
        onIgnore={jest.fn()}
      />
    );

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });
});
```

---

## 实现细节

### SettingsForm 组件

#### 表单结构

```typescript
return (
  <form onSubmit={handleSubmit} style={{ /* 内联样式 */ }}>
    <h3>Settings</h3>

    {/* API Key 输入 */}
    <div>
      <label>OpenAI API Key</label>
      <input
        type="password"
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        placeholder="sk-..."
        style={{ width: '100%', padding: '8px' }}
      />
    </div>

    {/* Base URL 输入 */}
    <div>
      <label>Base URL (Optional)</label>
      <input
        type="text"
        value={baseURL}
        onChange={e => setBaseURL(e.target.value)}
        placeholder="https://api.openai.com/v1"
        style={{ width: '100%', padding: '8px' }}
      />
    </div>

    {/* Inbox 路径输入 */}
    <div>
      <label>Inbox Path</label>
      <input
        type="text"
        value={inboxPath}
        onChange={e => setInboxPath(e.target.value)}
        placeholder="Inbox"
        style={{ width: '100%', padding: '8px' }}
      />
    </div>

    {/* 提交按钮 */}
    <button type="submit" style={{ /* 内联样式 */ }}>
      Save Configuration
    </button>
  </form>
);
```

**注意**：
- 所有样式都是内联（应提取到 CSS）
- 无表单验证（建议添加 API Key 格式检查）
- 无成功提示（建议添加 Toast 通知）

#### 状态管理

```typescript
const [apiKey, setApiKey] = useState(initialApiKey);
const [baseURL, setBaseURL] = useState(initialBaseUrl);
const [inboxPath, setInboxPath] = useState(initialInboxPath);
```

**特点**：
- 使用独立 state 管理每个字段
- 初始值从 Props 读取
- 无受控组件验证（建议添加）

### OrganizationalTable 组件

#### 表格结构

```typescript
return (
  <div className="org-table-container" style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #444' }}>
          <th>File</th>
          <th>Target Folder</th>
          <th>Tags</th>
          <th>Reason</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.map(file => {
          const suggestion = getSuggestion(file.path);
          return (
            <tr key={file.path}>
              <td>{file.name}</td>
              <td>
                {suggestion ? suggestion.targetFolder : <em>Analyzing...</em>}
              </td>
              <td>
                {suggestion ? suggestion.tags.join(', ') : '-'}
              </td>
              <td style={{ color: '#888', fontSize: '0.9em' }}>
                {suggestion?.reason || '-'}
              </td>
              <td>
                {suggestion && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onMove(file.path, suggestion)}>
                      Accept
                    </button>
                    <button onClick={() => onIgnore(file.path)}>
                      Ignore
                    </button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
```

**特点**：
- 固定宽度表格（响应式设计缺失）
- 硬编码颜色（应使用 CSS 变量）
- 简单的行渲染逻辑

#### 数据匹配逻辑

```typescript
const getSuggestion = (path: string) =>
  suggestions.find(s => s.path === path);
```

**性能**：
- 每次渲染都调用（建议使用 useMemo）
- 时间复杂度 O(n)（建议使用 Map 优化）

**优化建议**：
```typescript
const suggestionMap = useMemo(
  () => new Map(suggestions.map(s => [s.path, s])),
  [suggestions]
);

const getSuggestion = (path: string) => suggestionMap.get(path);
```

---

## 样式管理

### 当前实现

**内联样式**（所有样式硬编码在组件中）：
```typescript
style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}
style={{ background: '#7a51d1', color: 'white', border: 'none', ... }}
```

**局限**：
- 无法复用样式
- 难以维护主题
- 无法支持响应式设计
- 无法使用伪类和动画

### 建议改进

#### 方案 1：CSS Modules

```typescript
// styles.module.css
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.button {
  background: var(--interactive-accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

// SettingsForm.tsx
import styles from './styles.module.css';
return <form className={styles.form}> {/* ... */} </form>;
```

#### 方案 2：Tailwind CSS

```typescript
return (
  <form className="flex flex-col gap-4 max-w-md">
    <h3>Settings</h3>
    <input className="w-full p-2 border rounded" />
    <button className="bg-purple-600 text-white px-4 py-2 rounded">
      Save Configuration
    </button>
  </form>
);
```

#### 方案 3：Obsidian CSS 变量

```typescript
// 使用 Obsidian 主题变量
style={{
  background: 'var(--interactive-accent)',
  color: 'var(--text-on-accent)'
}}
```

---

## 可访问性 (Accessibility)

**当前状态**：基本可访问

**建议改进**：

1. **语义化 HTML**：
   ```typescript
   // 当前
   <div onClick={handleSave}>Save</div>

   // 改进
   <button type="submit" onClick={handleSave}>Save</button>
   ```

2. **键盘导航**：
   ```typescript
   // 添加键盘快捷键
   <button
     onClick={handleAccept}
     onKeyDown={(e) => e.key === 'Enter' && handleAccept()}
   >
     Accept
   </button>
   ```

3. **ARIA 标签**：
   ```typescript
   <input
     aria-label="OpenAI API Key"
     aria-required="true"
     type="password"
   />
   ```

4. **焦点管理**：
   ```typescript
   // 保存后聚焦到提示元素
   const submitButtonRef = useRef<HTMLButtonElement>(null);

   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     onSave({ apiKey, baseURL, inboxPath });
     submitButtonRef.current?.focus();
   };
   ```

---

## 性能优化

### 当前性能特征

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| 渲染表单 | O(1) | 固定字段数 |
| 渲染表格 | O(n) | n = 文件数量 |
| 查找建议 | O(n) | 每行遍历 suggestions |

### 优化建议

1. **虚拟滚动**（大量文件）：
   ```typescript
   import { FixedSizeList } from 'react-window';

   <FixedSizeList
     height={600}
     itemCount={files.length}
     itemSize={50}
     width="100%"
   >
     {({ index, style }) => (
       <div style={style}>
         {/* 渲染单个文件行 */}
       </div>
     )}
   </FixedSizeList>
   ```

2. **记忆化**（避免重渲染）：
   ```typescript
   export const OrganizationalTable = React.memo(({
     files,
     suggestions,
     onMove,
     onIgnore
   }) => {
     // ...
   });
   ```

3. **延迟加载**（按需渲染）：
   ```typescript
   const [visibleCount, setVisibleCount] = useState(20);

   return (
     <>
       {files.slice(0, visibleCount).map(file => /* ... */)}
       <button onClick={() => setVisibleCount(prev => prev + 20)}>
         Load More
       </button>
     </>
   );
   ```

---

## 常见问题 (FAQ)

**Q: 为什么使用内联样式而非 CSS 文件？**
A: 快速原型开发阶段的简化选择。生产环境应迁移到 CSS Modules 或 Tailwind CSS。

**Q: 如何支持暗黑主题？**
A: 使用 Obsidian CSS 变量（如 `var(--background-primary)`），避免硬编码颜色。

**Q: 表单验证如何实现？**
A: 建议使用 `react-hook-form` + `zod` 实现类型安全的表单验证。

**Q: 如何实现响应式设计？**
A: 使用 CSS Grid/Flexbox 或 Tailwind 的响应式类（如 `md:flex-row`）。

---

## 相关文件清单

```
src/components/
├── SettingsForm.tsx        # 设置表单组件
├── OrganizationalTable.tsx # 整理表格组件
├── SettingsForm.js         # 编译产物
└── OrganizationalTable.js  # 编译产物
```

---

## 扩展建议

### 未来增强方向

1. **UI 组件库**：
   - 引入 shadcn/ui 或 Material-UI
   - 统一设计语言

2. **主题支持**：
   - 支持自定义主题色
   - 响应 Obsidian 主题变化

3. **国际化**：
   - 支持多语言界面
   - 使用 i18next

4. **无障碍功能**：
   - 高对比度模式
   - 键盘快捷键
   - 屏幕阅读器支持

5. **高级表格功能**：
   - 排序
   - 筛选
   - 列宽调整
   - 导出 CSV

6. **动画与过渡**：
   - Framer Motion 动画
   - 加载状态过渡
   - 文件移动动画

---

## 参考资源

- [React 组件最佳实践](https://react.dev/learn/thinking-in-react)
- [CSS Modules 文档](https://github.com/css-modules/css-modules)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [WCAG 无障碍指南](https://www.w3.org/WAI/WCAG21/quickref/)

---

*文档生成时间：2026-01-17 19:27:29*
