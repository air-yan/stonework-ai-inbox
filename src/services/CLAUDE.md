# Services Module

[根目录](../../CLAUDE.md) > [src](../) > **services**

## 变更记录 (Changelog)

### 2026-01-27
- 补充 AIService 流式聊天服务文档
- 更新 PARAService 文档（真实 AI 调用已实现）
- 标记 OpenAIService 为废弃状态

### 2026-01-17
- 初始化模块文档
- 分析 OpenAI 服务实现与 Mock 策略

---

## 模块职责

**服务模块**负责封装外部 API 调用与业务逻辑，目前包含三个服务：

- **PARAService**：文件分类分析服务（基于 PARA 方法论）
  - 真实 AI 调用（OpenRouter + AI SDK）
  - 结构化 JSON 输出
  - 中英文支持

- **AIService**：通用流式聊天服务
  - 流式响应（实时打字效果）
  - 上下文窗口管理
  - 多模型支持（通过 OpenRouter）

- **OpenAIService**：旧版服务（已废弃，仅保留 Mock 数据）

该模块是连接业务逻辑与 AI 能力的桥梁，负责：
1. 管理 API 客户端初始化与配置
2. 构建与优化 Prompt
3. 解析与验证 AI 返回结果
4. 错误处理与降级策略

---

## 入口与启动

### PARAService 类

```typescript
export class PARAService {
  constructor(config: AIConfig)
  updateConfig(config: AIConfig): void
  async analyzeDocument(
    documentContent: string,
    allTags: string[],
    folderTree: string
  ): Promise<PARAAnalysisResult>
}

interface AIConfig {
  apiKey: string;
  baseURL: string;
  modelName: string;
  language?: 'en' | 'zh';
}

interface PARAAnalysisResult {
  folderSuggestions: FolderSuggestion[];  // 3 个文件夹选项
  tags: string[];
  newTags?: string[];
  reason: string;
}
```

### AIService 类

```typescript
export class AIService {
  constructor(config: AIConfig)
  updateConfig(config: AIConfig): void
  async streamChat(
    messages: CoreMessage[],
    onDelta: (chunk: string) => void,
    onError: (err: any) => void
  ): Promise<void>
}

type CoreMessage = SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage;
```

### 初始化方式

```typescript
// PARAService
const paraService = new PARAService({
  apiKey: 'sk-...',
  baseURL: 'https://openrouter.ai/api/v1',
  modelName: 'anthropic/claude-3.5-sonnet',
  language: 'zh'
});

// AIService
const aiService = new AIService({
  apiKey: 'sk-...',
  baseURL: 'https://openrouter.ai/api/v1',
  modelName: 'deepseek/deepseek-chat'
});
```

---

## 对外接口

### PARAService.analyzeDocument

**功能**：分析单个文档，生成 PARA 分类建议

**参数**：
```typescript
documentContent: string  // 文档内容
allTags: string[]        // 现有标签列表
folderTree: string       // 文件夹树结构
```

**返回值**：
```typescript
Promise<PARAAnalysisResult>  // 分类建议
```

**示例**：
```typescript
const result = await paraService.analyzeDocument(
  'Meeting notes about project Alpha',
  ['#work', '#todo', '#project'],
  '- Projects/\n  - Project-Alpha/\n- Areas/\n  - Work/'
);
// 返回：
// {
//   folderSuggestions: [
//     { folder: 'Projects/Project-Alpha', isNew: false, reason: '匹配现有项目' },
//     { folder: 'Areas/Work', isNew: false, reason: '工作相关' },
//     { folder: 'Projects/New-Project', isNew: true, reason: '建议创建新项目' }
//   ],
//   tags: ['#work', '#project'],
//   newTags: ['#project'],
//   reason: '内容关于项目 Alpha 会议，适合放在项目文件夹下'
// }
```

### AIService.streamChat

**功能**：流式聊天对话

**参数**：
```typescript
messages: CoreMessage[]  // 消息历史
onDelta: (chunk: string) => void  // 流式回调
onError: (err: any) => void  // 错误回调
```

**返回值**：
```typescript
Promise<void>  // 通过回调异步返回结果
```

**示例**：
```typescript
const messages: CoreMessage[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
];

await aiService.streamChat(
  messages,
  (chunk) => console.log('收到:', chunk),  // 实时输出
  (err) => console.error('错误:', err)
);
```

---

## 关键依赖与配置

### 外部依赖

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';  // PARAService
import { streamText } from 'ai';     // AIService
```

### 配置要求

**必需**：
- `apiKey`: OpenRouter/OpenAI API Key
- `modelName`: 模型名称（如 `deepseek/deepseek-chat`）

**可选**：
- `baseURL`: 自定义 API 端点（默认 OpenRouter）
- `language`: 界面语言（`en` 或 `zh`）

**当前行为**：
- PARAService：真实 AI 调用（已实现）
- AIService：真实流式响应（已实现）
- OpenAIService：Mock 数据（已废弃）

---

## 数据模型

### PARAAnalysisResult（PARAService 输出）

```typescript
interface PARAAnalysisResult {
  folderSuggestions: FolderSuggestion[];  // 3 个文件夹选项
  tags: string[];        // 推荐标签（如 ['#work', '#todo']）
  newTags?: string[];    // 仅包含新创建的标签
  reason: string;        // AI 推理说明
}

interface FolderSuggestion {
  folder: string;    // 完整路径（如 "Projects/Alpha"）
  isNew: boolean;    // 是否是新文件夹
  reason: string;    // 推荐理由
}
```

### CoreMessage（AIService 输入）

```typescript
type CoreMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool'; content: any };  // 工具调用结果
```

---

## 测试与质量

**当前状态**：无自动化测试

**建议补充**：

### PARAService 测试

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PARAService } from './PARAService';

describe('PARAService', () => {
  it('should parse JSON response correctly', async () => {
    const service = new PARAService({
      apiKey: 'test-key',
      baseURL: 'https://api.test.com',
      modelName: 'test-model'
    });

    // Mock AI SDK
    vi.mock('ai', () => ({
      generateText: async () => ({
        text: JSON.stringify({
          folderSuggestions: [
            { folder: 'Projects/Test', isNew: false, reason: 'Test' }
          ],
          tags: ['#test'],
          newTags: [],
          reason: 'Test reason'
        })
      })
    }));

    const result = await service.analyzeDocument('Test content', [], '');
    expect(result.folderSuggestions).toHaveLength(1);
    expect(result.folderSuggestions[0].folder).toBe('Projects/Test');
  });

  it('should handle malformed JSON gracefully', async () => {
    const service = new PARAService({ /* ... */ });
    // Mock 返回无效 JSON
    const result = await service.analyzeDocument('Test', [], '');
    expect(result.folderSuggestions).toEqual([]);
    expect(result.reason).toContain('无法解析');
  });
});
```

### AIService 测试

```typescript
import { AIService } from './AIService';

describe('AIService', () => {
  it('should stream chat response', async () => {
    const service = new AIService({
      apiKey: 'test-key',
      baseURL: 'https://api.test.com',
      modelName: 'test-model'
    });

    const chunks: string[] = [];
    const onDelta = (chunk: string) => chunks.push(chunk);

    // Mock streamText
    vi.mock('ai', () => ({
      streamText: async () => ({
        textStream: (async function* () {
          yield 'Hello';
          yield ' World';
        })()
      })
    }));

    await service.streamChat(
      [{ role: 'user', content: 'Hi' }],
      onDelta,
      () => {}
    );

    expect(chunks).toEqual(['Hello', ' World']);
  });

  it('should handle errors', async () => {
    const service = new AIService({ /* ... */ });
    const onError = vi.fn();

    // Mock 抛出错误
    await service.streamChat(
      [{ role: 'user', content: 'Hi' }],
      () => {},
      onError
    );

    expect(onError).toHaveBeenCalled();
  });
});
```

---

## 实现细节

### PARAService 核心逻辑

#### System Prompt 构建

```typescript
const getSystemPrompt = (language: 'en' | 'zh') => {
  const langInstruction = language === 'en'
    ? '4. **Language**: Output analysis and reasons in English.'
    : '4. **语言**：分析和原因说明使用中文。';

  return `# 📦 PARA 整理与标签推荐助手（CODE·Organize）

## 核心任务
基于用户提供的 Vault 信息（标签列表、文件夹树）和当前文档内容，输出 JSON 格式的分类建议。

## 工作逻辑
1. **分析文档**：理解文档的核心主题。
2. **匹配路径**：
   - **优先复用**：在提供的 FolderTree 中寻找最合适的现有文件夹。
   - **新建路径**：如果现有路径均不合适（例如属于全新的项目或领域），则建议一个新的路径。
   - **区分新旧**：明确标记推荐的路径是现有的还是需要新建的。
3. **匹配标签**：
   - **优先复用**：从提供的标签列表中选择。
   - **新建标签**：必要时创建新标签（使用 kebab-case）。

## 约束与规则
1. **JSON 输出**：必须输出合法的 JSON 格式，不要包含 Markdown 代码块标记（如 \`\`\`json）。
2. **数量限制**：提供 3 个文件夹建议，最多 3 个标签建议。
3. **命名规范**：新文件夹建议 3-6 字，动宾或名词短语。
${langInstruction}
`;
};
```

**特点**：
- 结构化 Prompt（引导 AI 输出特定格式）
- 多语言支持（动态插入语言指令）
- PARA 方法论嵌入（优先复用、区分新旧）

#### User Prompt 构建

```typescript
private buildUserPrompt(documentContent: string, allTags: string[], folderTree: string): string {
  return `## 当前 Vault 信息

**现有标签列表**:
${allTags.length > 0 ? allTags.join(', ') : '(暂无标签)'}

**现有文件夹结构 (Folder Tree)**:
${folderTree}

## 待分析文档内容

\`\`\`markdown
${documentContent}
\`\`\`

请输出 JSON 格式的 PARA 分类建议。`;
}
```

**特点**：
- 上下文信息完整（标签 + 文件夹树）
- Markdown 代码块包裹（避免格式混乱）

#### JSON 解析与验证

```typescript
private parseJSONResponse(jsonText: string): PARAAnalysisResult {
  try {
    // 清理可能的 Markdown 标记
    const cleanedText = jsonText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    // 转换并验证结构
    const folderSuggestions = Array.isArray(parsed.folderSuggestions)
      ? parsed.folderSuggestions.map((s: any) => ({
          folder: s.folder || '',
          reason: s.reason || '',
          isNew: !!s.isNew
        }))
      : [];

    const tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [];
    const newTags = Array.isArray(parsed.newTags) ? parsed.newTags.slice(0, 3) : [];
    const reason = parsed.reason || '';

    return { folderSuggestions, tags, newTags, reason };
  } catch (e) {
    console.error('[PARAService] JSON Parse Error:', e);
    return {
      folderSuggestions: [],
      tags: [],
      reason: '无法解析 AI 返回的 JSON 数据'
    };
  }
}
```

**容错机制**：
- 清理 Markdown 代码块标记
- 限制标签数量（最多 3 个）
- 提供默认值（空数组、空字符串）
- 捕获解析错误

### AIService 核心逻辑

#### 流式响应

```typescript
async streamChat(messages: CoreMessage[], onDelta: (chunk: string) => void, onError: (err: any) => void) {
  try {
    const openrouter = createOpenRouter({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL || 'https://openrouter.ai/api/v1',
    });

    const model = openrouter(this.config.modelName);

    const result = await streamText({
      model: model,
      messages: messages,
    });

    for await (const delta of result.textStream) {
      onDelta(delta);
    }
  } catch (error) {
    onError(error);
  }
}
```

**流程**：
1. 初始化 OpenRouter provider
2. 调用 `streamText`（AI SDK）
3. 使用 `for await` 循环读取流式数据
4. 每次收到 chunk 时调用 `onDelta`
5. 错误时调用 `onError`

**注意**：
- 消息格式直接传递给 AI SDK（CoreMessage[]）
- 不做额外清理或验证（依赖 provider 处理）

#### 上下文窗口管理

在 `ChatPanel.tsx` 中实现：

```typescript
// 滑动窗口：保留最近 15 条消息
const contextMessages = newHistory.slice(-15);

await aiService.streamChat(
  contextMessages,
  (delta) => { /* 更新 UI */ },
  (err) => { /* 处理错误 */ }
);
```

**优势**：
- 限制上下文长度（节省 Token）
- 保留最近对话历史（连贯性）
- 自动裁剪旧消息（防止超限）

### OpenAIService（废弃）

**当前实现**：Mock 数据（关键词匹配）

```typescript
private mockSuggestions(files: FileMetadata[]): OrganizationSuggestion[] {
  return files.map(f => {
    const isProject = f.content.includes('project');
    const isPersonal = f.content.includes('milk') || f.content.includes('personal');

    return {
      path: f.path,
      folderSuggestions: [
        {
          folder: isProject ? '2. Areas/Projects' : 'Resources/Notes',
          reason: isProject ? '内容包含项目相关关键词' : '一般性笔记内容'
        },
        // ... 更多建议
      ],
      selectedFolderIndex: 0,
      tags: isPersonal ? ['#personal', '#todo'] : ['#work'],
      area: isProject ? 'Project Alpha' : undefined
    };
  });
}
```

**废弃原因**：
- 已被 PARAService 替代（真实 AI 调用）
- Mock 逻辑过于简单（无语义理解）
- 不建议继续使用

---

## 性能优化

### 批量处理

**当前实现**（InboxView.tsx）：

```typescript
const handleScanAll = async () => {
  const batchSize = 3;
  for (let i = 0; i < filesToScan.length; i += batchSize) {
    const batch = filesToScan.slice(i, i + batchSize);
    await Promise.all(batch.map(f => handleScanRow(f.path, f.content)));
  }
};
```

**特点**：
- 每批 3 个并发请求
- 避免同时发送过多请求（API 限流）
- 串行批次处理（等待上一批完成）

**优化建议**：
- 动态调整批次大小（根据文件数量）
- 失败重试机制（跳过失败的单个文件）
- 进度条显示（当前批次/总批次）

### 缓存策略

**建议实现**：

```typescript
class PARAService {
  private cache = new Map<string, PARAAnalysisResult>();

  async analyzeDocument(content: string, tags: string[], tree: string) {
    // 生成缓存键
    const cacheKey = this.hashContent(content);

    if (this.cache.has(cacheKey)) {
      console.log('[PARAService] Cache hit');
      return this.cache.get(cacheKey)!;
    }

    const result = await this.callAI(content, tags, tree);
    this.cache.set(cacheKey, result);
    return result;
  }

  private hashContent(content: string): string {
    // 简单哈希（生产环境建议用 crypto）
    return content.slice(0, 100).replace(/\s/g, '');
  }
}
```

**优势**：
- 避免重复分析相同内容
- 减少 API 调用次数
- 提升响应速度

---

## 错误处理

### 当前实现

**PARAService**：

```typescript
try {
  const { text } = await generateText({ /* ... */ });
  return this.parseJSONResponse(text);
} catch (error) {
  console.error('[PARAService] Analysis failed:', error);
  return {
    folderSuggestions: [],
    tags: [],
    reason: `分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
  };
}
```

**AIService**：

```typescript
try {
  // 流式响应
} catch (error) {
  onError(error);  // 传递给调用方处理
}
```

### 建议增强

```typescript
class PARAService {
  async analyzeDocument(/* ... */) {
    try {
      return await this.callAI(/* ... */);
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        if (error.status === 401) {
          throw new Error('Invalid API key. Please check your settings.');
        }
      }
      // 降级到关键词匹配
      console.warn('[PARAService] AI failed, falling back to keyword analysis');
      return this.fallbackAnalysis(content);
    }
  }
}
```

---

## 常见问题 (FAQ)

**Q: PARAService 和 AIService 有什么区别？**
A: PARAService 专门用于文件分类（结构化 JSON 输出），AIService 是通用聊天服务（流式文本输出）。

**Q: 为什么使用 OpenRouter 而非直接 OpenAI？**
A: OpenRouter 支持多模型（Claude、DeepSeek、本地模型等），且价格更灵活。

**Q: 如何切换模型？**
A: 修改 `modelName` 配置（如从 `deepseek/deepseek-chat` 切换到 `anthropic/claude-3.5-sonnet`）。

**Q: 流式响应的性能如何？**
A: 流式响应延迟更低（首次响应时间 < 1s），用户体验更好。

**Q: 如何支持其他语言？**
A: 修改 `getSystemPrompt` 中的 `language` 参数，动态切换语言指令。

---

## 相关文件清单

```
src/services/
├── PARAService.ts      # PARA 分类服务（主要使用）
├── AIService.ts        # 流式聊天服务
├── OpenAIService.ts    # 旧版服务（已废弃）
├── PARAService.js      # 编译产物
├── AIService.js        # 编译产物
└── OpenAIService.js    # 编译产物
```

---

## 扩展建议

### 未来增强方向

1. **多模型支持**：
   - 支持 Claude API（直接集成）
   - 支持本地模型（Ollama、LM Studio）

2. **自定义 Prompt**：
   - 允许用户配置 System Prompt
   - 支持预设 Prompt 模板

3. **智能缓存**：
   - 缓存 AI 分析结果
   - 只分析新增或修改的文件

4. **成本控制**：
   - 显示 Token 使用统计
   - 支持设置单次分析上限
   - 自动选择最便宜的模型

5. **错误重试**：
   - 指数退避重试（Exponential Backoff）
   - 自动降级到 Mock 模式

6. **RAG 增强**：
   - 基于知识库检索（Embedding）
   - 语义搜索相似文档

---

## 参考资源

- [AI SDK (Vercel)](https://sdk.vercel.ai/docs)
- [OpenRouter](https://openrouter.ai/)
- [PARA Method](https://fortelabs.co/blog/para/)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

---

*文档生成时间：2026-01-27 21:35:33*
