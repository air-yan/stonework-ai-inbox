import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { FolderSuggestion } from '../adapters/types';

export interface AIConfig {
    apiKey: string;
    baseURL: string;
    modelName: string;
    language?: 'en' | 'zh';
}

export interface PARAAnalysisResult {
    folderSuggestions: FolderSuggestion[];  // 3 个文件夹选项
    tags: string[];
    newTags?: string[]; // 新标签列表
    reason: string;
}

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
    - **区分新旧**：明确标记哪些标签是新创建的。

## 约束与规则

1. **JSON 输出**：必须输出合法的 JSON 格式，不要包含 Markdown 代码块标记（如 \`\`\`json）。
2. **数量限制**：提供 3 个文件夹建议，最多 3 个标签建议。
3. **命名规范**：新文件夹建议 3-6 字，动宾或名词短语。
${langInstruction}

## 输出 JSON 结构

{
  "folderSuggestions": [
    { 
      "folder": "完整路径 (例如 Projects/MyProject)", 
      "isNew": boolean, 
      "reason": "简短推荐理由" 
    }
  ],
  "tags": ["#tag1", "#tag2"],
  "newTags": ["#tag2"], // 仅包含新创建的标签
  "reason": "整体分类逻辑摘要"
}
`;
};

export class PARAService {
    private config: AIConfig;

    constructor(config: AIConfig) {
        this.config = config;
    }

    updateConfig(config: AIConfig) {
        this.config = config;
    }

    /**
     * 分析单个文档，返回 PARA 分类建议 (JSON 模式)
     */
    async analyzeDocument(
        documentContent: string,
        allTags: string[],
        folderTree: string,
        allFolders?: string[]
    ): Promise<PARAAnalysisResult> {
        // 构建 user prompt
        const userPrompt = this.buildUserPrompt(documentContent, allTags, folderTree);
        const systemPrompt = getSystemPrompt(this.config.language || 'en');

        try {
            // 初始化 OpenRouter provider
            const openrouter = createOpenRouter({
                apiKey: this.config.apiKey,
                baseURL: this.config.baseURL || 'https://openrouter.ai/api/v1',
            });

            const model = openrouter(this.config.modelName);

            const { text } = await generateText({
                model: model,
                system: systemPrompt,
                prompt: userPrompt,
            });

            // 解析 JSON，并用实际文件夹列表校验 isNew
            const result = this.parseJSONResponse(text);
            if (allFolders && allFolders.length > 0) {
                this.validateIsNew(result, allFolders);
            }
            return result;
        } catch (error) {
            return {
                folderSuggestions: [],
                tags: [],
                reason: `分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

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

    /**
     * 用实际文件夹列表校验 AI 返回的 isNew 字段，防止 AI 幻觉误判
     */
    private validateIsNew(result: PARAAnalysisResult, allFolders: string[]): void {
        const normalizedFolders = allFolders.map(f => f.toLowerCase().replace(/\\/g, '/').replace(/\/+$/, ''));

        for (const suggestion of result.folderSuggestions) {
            const normalizedSuggestion = suggestion.folder.toLowerCase().replace(/\\/g, '/').replace(/\/+$/, '');

            // 精确匹配：建议的路径完全等于已有路径
            const exactMatch = normalizedFolders.includes(normalizedSuggestion);

            // 前缀匹配：建议路径是某个已有路径的子路径（父目录存在）
            const parentMatch = normalizedFolders.some(f => normalizedSuggestion.startsWith(f + '/'));

            if (exactMatch) {
                // 文件夹已存在，强制覆盖为 false
                suggestion.isNew = false;
            } else if (!parentMatch) {
                // 连父目录都不存在，确实是新建
                suggestion.isNew = true;
            }
            // 父目录存在但精确路径不存在的情况，保留 AI 的判断（isNew: true）
        }
    }

    private parseJSONResponse(jsonText: string): PARAAnalysisResult {
        try {
            // 尝试清理可能存在的 Markdown 标记
            const cleanedText = jsonText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            const parsed = JSON.parse(cleanedText);

            // 验证并转换结构
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
            return {
                folderSuggestions: [],
                tags: [],
                reason: '无法解析 AI 返回的 JSON 数据'
            };
        }
    }
}
