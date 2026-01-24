# Services Module

[根目录](../../CLAUDE.md) > [src](../) > **services**

## 变更记录 (Changelog)

### 2026-01-17
- 初始化模块文档
- 分析 OpenAI 服务实现与 Mock 策略

---

## 模块职责

**服务模块**负责封装外部 API 调用与业务逻辑，目前包含：

- **OpenAIService**：封装 OpenAI API 调用，提供 AI 分类建议生成功能
  - 当前实现：Mock 数据（关键词分析）
  - 预留接口：真实 LLM 调用（待实现）

该模块是连接业务逻辑与 AI 能力的桥梁，负责：
1. 管理 API 客户端初始化与配置
2. 构建与优化 Prompt
3. 解析与验证 AI 返回结果
4. 错误处理与降级策略

---

## 入口与启动

### OpenAIService 类

```typescript
export class OpenAIService {
  constructor(apiKey?: string, baseURL?: string)
  updateConfig(apiKey: string, baseURL?: string): void
  async generateSuggestions(files: FileMetadata[]): Promise<OrganizationSuggestion[]>
  private mockSuggestions(files: FileMetadata[]): OrganizationSuggestion[]
}
```

### 初始化方式

**当前实现**：
```typescript
// 无 API Key 时使用 Mock 模式
const llmService = new OpenAIService();

// 传入 API Key 后可切换到真实调用
llmService.updateConfig('sk-...', 'https://api.openai.com/v1');
```

**配置来源**：从插件设置中读取（`PluginSettings.apiKey`、`PluginSettings.baseURL`）

---

## 对外接口

### generateSuggestions 方法

**功能**：分析文件列表，生成分类建议

**参数**：
```typescript
files: FileMetadata[]  // 从 Inbox 读取的文件列表
```

**返回值**：
```typescript
Promise<OrganizationSuggestion[]>  // 每个文件的分类建议
```

**示例**：
```typescript
const files = [
  { path: 'Inbox/Note1.md', name: 'Note1.md', content: 'Meeting about project Alpha' }
];

const suggestions = await llmService.generateSuggestions(files);
// 返回：
// [{
//   path: 'Inbox/Note1.md',
//   targetFolder: '2. Areas/Projects',
//   tags: ['#work'],
//   area: 'Project Alpha',
//   reason: 'Keyword analysis (Mock)'
// }]
```

---

## 关键依赖与配置

### 外部依赖

```typescript
import OpenAI from 'openai';
import { FileMetadata, OrganizationSuggestion } from '../adapters/types';
```

### 配置要求

**必需**：
- `apiKey`: OpenAI API Key（或兼容服务的 Key）

**可选**：
- `baseURL`: 自定义 API 端点（用于兼容 OpenAI 代理服务）

**当前行为**：
- 无 API Key 时自动降级到 Mock 模式（返回基于关键词的建议）
- 有 API Key 但未实现真实调用（预留接口）

---

## 数据模型

### OrganizationSuggestion（输出）

```typescript
interface OrganizationSuggestion {
  path: string;          // 源文件路径（与输入对应）
  targetFolder: string;  // 目标文件夹路径
  tags: string[];        // 推荐标签（如 ['#work', '#todo']）
  area?: string;         // PARA 方法中的 Area（可选）
  reason?: string;       // AI 推理说明（为何这样分类）
}
```

### FileMetadata（输入）

```typescript
interface FileMetadata {
  path: string;      // 文件路径
  name: string;      // 文件名
  content: string;   // 文件完整内容
}
```

---

## 测试与质量

**当前状态**：无自动化测试

**建议补充**：

### 单元测试示例

```typescript
describe('OpenAIService', () => {
  it('should return mock suggestions when no API key', async () => {
    const service = new OpenAIService();
    const files = [
      { path: 'Inbox/test.md', name: 'test.md', content: 'project update' }
    ];
    const suggestions = await service.generateSuggestions(files);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].targetFolder).toBe('2. Areas/Projects');
  });

  it('should use real API when configured', async () => {
    const service = new OpenAIService('sk-test');
    // Mock OpenAI client
    const spy = jest.spyOn(service, 'client').mockResolvedValue({ ... });
    // 验证调用
  });
});
```

### 集成测试建议

- 使用 OpenAI 测试 API Key 验证真实调用
- 测试错误场景（API 限流、网络错误、超时）
- 验证返回数据格式正确性

---

## 实现细节

### 当前实现：Mock 模式

```typescript
private mockSuggestions(files: FileMetadata[]): OrganizationSuggestion[] {
  return files.map(f => ({
    path: f.path,
    targetFolder: f.content.includes('project') ? '2. Areas/Projects' : 'Resources',
    tags: f.content.includes('milk') ? ['#personal', '#todo'] : ['#work'],
    area: f.content.includes('project') ? 'Project Alpha' : undefined,
    reason: 'Keyword analysis (Mock)'
  }));
}
```

**逻辑**：
- 简单关键词匹配（`includes`）
- 硬编码分类规则（'project' → Projects，'milk' → Personal）

**局限**：
- 无法理解语义（如 "alpha initiative" 也会被识别为项目）
- 无上下文理解（无法根据已有目录结构推荐）
- 无法处理复杂场景（多主题文件）

### 待实现：真实 LLM 调用

**TODO 位置**：`OpenAIService.ts:33-35`

```typescript
// TODO: Implement real LLM Call with Structured Output
// For now, returning mock to save tokens as per plan
return this.mockSuggestions(files);
```

**建议实现方案**：

#### 方案 1：Structured Output（推荐）

```typescript
async generateSuggestions(files: FileMetadata[]): Promise<OrganizationSuggestion[]> {
  if (!this.client) return this.mockSuggestions(files);

  const response = await this.client.responses.create({
    model: 'gpt-4o-mini',
    input: files.map(f => ({
      role: 'user',
      content: `Analyze this note and suggest organization:\n${f.content}`
    })),
    text: {
      format: {
        type: 'json_schema',
        name: 'organization_suggestions',
        schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  targetFolder: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  area: { type: 'string' },
                  reason: { type: 'string' }
                },
                required: ['path', 'targetFolder', 'tags', 'reason']
              }
            }
          },
          required: ['suggestions']
        }
      }
    }
  });

  return JSON.parse(response.output[0].content[0].text).suggestions;
}
```

**优势**：
- 强制 JSON 格式，无需手动解析
- 减少 Token 消耗（无需在 Prompt 中反复强调格式）
- 降低出错概率

#### 方案 2：Function Calling

```typescript
const response = await this.client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a knowledge management assistant...'
    },
    {
      role: 'user',
      content: `Analyze these notes:\n${JSON.stringify(files)}`
    }
  ],
  functions: [
    {
      name: 'suggest_organization',
      description: 'Suggest file organization',
      parameters: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: { /* ... */ }
          }
        }
      }
    }
  ],
  function_call: { name: 'suggest_organization' }
});
```

#### 方案 3：传统 Prompt + 解析

```typescript
const prompt = `
Analyze these notes and suggest organization in JSON format:
${files.map(f => `- ${f.name}: ${f.content}`).join('\n')}

Output format:
[
  {
    "path": "Inbox/Note1.md",
    "targetFolder": "Projects/Alpha",
    "tags": ["#work"],
    "area": "Project Alpha",
    "reason": "Keywords: project, alpha"
  }
]
`;

const response = await this.client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }]
});

const content = response.choices[0].message.content;
return JSON.parse(content);
```

**局限**：
- 需要手动解析 JSON（易出错）
- 需要在 Prompt 中强调格式
- 需要 try-catch + 重试机制

### 错误处理策略

**当前实现**：
- 无 API Key 时降级到 Mock
- API 错误时直接 `console.error`

**建议增强**：

```typescript
async generateSuggestions(files: FileMetadata[]): Promise<OrganizationSuggestion[]> {
  try {
    if (!this.client) {
      console.warn("OpenAI Client not initialized, returning mock suggestions.");
      return this.mockSuggestions(files);
    }

    const response = await this.client.responses.create({ /* ... */ });
    return parseResponse(response);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your settings.');
      }
    }
    // 降级到 Mock
    console.error('AI analysis failed, falling back to keyword analysis:', error);
    return this.mockSuggestions(files);
  }
}
```

---

## Prompt 设计建议

### 系统提示词（System Prompt）

```typescript
const SYSTEM_PROMPT = `
You are a knowledgeable assistant for organizing digital notes using the PARA method.

**PARA Method**:
- **Projects**: Short-term efforts with a goal (e.g., "Launch website v2")
- **Areas**: Long-term responsibilities (e.g., "Health", "Finances")
- **Resources**: Topics of ongoing interest (e.g., "Investment strategies")
- **Archives**: Completed or inactive items

**Your Task**:
Analyze each note and suggest:
1. **targetFolder**: Where to move it (e.g., "Projects/Website Redesign")
2. **tags**: Relevant hashtags (e.g., #work, #ux-design)
3. **area**: Which Area it belongs to (if applicable)
4. **reason**: Brief explanation of your decision

**Constraints**:
- Use existing folder structure when possible
- Tags should be concise and reusable
- Area should link to existing MOC files if available
- Output MUST be valid JSON matching the provided schema
`;
```

### 用户提示词构建

```typescript
const buildUserPrompt = (files: FileMetadata[], existingFolders: string[]) => {
  return `
**Existing Folders**:
${existingFolders.join('\n')}

**Notes to Organize**:
${files.map(f => `
### ${f.name}
Path: ${f.path}
Content:
${f.content}
---
`).join('\n')}

Please analyze these notes and provide organization suggestions.
`;
};
```

### 优化建议

1. **上下文感知**：传入现有目录结构，避免推荐不存在的文件夹
2. **少样本学习**：在 Prompt 中提供示例（Few-shot Learning）
3. **渐进式分析**：先批量提取关键词，再调用 LLM 分类
4. **成本控制**：使用 `gpt-4o-mini` 降低成本，或使用本地模型

---

## 性能优化

### 批量处理

**当前实现**：一次性发送所有文件

**优化方案**：

```typescript
// 分批处理（每批 10 个文件）
async generateSuggestions(files: FileMetadata[]): Promise<OrganizationSuggestion[]> {
  const BATCH_SIZE = 10;
  const results: OrganizationSuggestion[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const suggestions = await this.processBatch(batch);
    results.push(...suggestions);
  }

  return results;
}
```

### 流式输出

```typescript
// 使用 Streaming API 提升用户体验
async generateSuggestionsStream(
  files: FileMetadata[],
  onProgress: (suggestion: OrganizationSuggestion) => void
): Promise<OrganizationSuggestion[]> {
  const stream = await this.client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(files) }],
    stream: true
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      const parsed = parseStreamingJSON(content);
      if (parsed) onProgress(parsed);
    }
  }
}
```

---

## 常见问题 (FAQ)

**Q: 为什么当前使用 Mock 而非真实 API？**
A: 开发初期为了节省 Token 成本并加快迭代速度。Mock 模式足以验证 UI 和交互逻辑。

**Q: 如何切换到真实 API？**
A: 在插件设置中配置 API Key 和 Base URL，然后实现 `generateSuggestions` 中的真实调用逻辑。

**Q: 支持其他 LLM 提供商吗？**
A: 当前只支持 OpenAI 格式。可以通过 `baseURL` 参数使用兼容 OpenAI 的服务（如 Azure OpenAI、本地 Ollama）。

**Q: 如何处理 API 调用失败？**
A: 建议实现降级策略：失败时回退到 Mock 模式或关键词分析，并向用户显示友好提示。

---

## 相关文件清单

```
src/services/
├── OpenAIService.ts    # AI 服务实现
└── OpenAIService.js    # 编译产物
```

---

## 扩展建议

### 未来增强方向

1. **多模型支持**：
   - 支持 Claude API
   - 支持本地模型（Ollama、LM Studio）
   - 抽象通用 LLM 接口

2. **智能缓存**：
   - 缓存已分析的文件内容
   - 只分析新增或修改的文件

3. **自定义规则**：
   - 允许用户配置分类规则
   - 支持正则表达式匹配

4. **批量优化**：
   - 自动识别相似文档并批量处理
   - 使用 Embedding 进行相似度聚类

5. **成本控制**：
   - 显示 Token 使用统计
   - 支持设置单次分析上限

---

## 参考资源

- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI Node SDK](https://github.com/openai/openai-node)
- [PARA Method](https://fortelabs.co/blog/para/)

---

*文档生成时间：2026-01-17 19:27:29*
