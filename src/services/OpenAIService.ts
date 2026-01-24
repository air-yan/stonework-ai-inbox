import OpenAI from 'openai';
import { FileMetadata, OrganizationSuggestion } from '../adapters/types';

export class OpenAIService {
    private client: OpenAI | null = null;

    constructor(apiKey?: string, baseURL?: string) {
        if (apiKey) {
            this.client = new OpenAI({
                apiKey,
                baseURL: baseURL || undefined,
                dangerouslyAllowBrowser: true
            });
        }
    }

    updateConfig(apiKey: string, baseURL?: string) {
        this.client = new OpenAI({
            apiKey,
            baseURL: baseURL || undefined,
            dangerouslyAllowBrowser: true
        });
    }

    async generateSuggestions(files: FileMetadata[]): Promise<OrganizationSuggestion[]> {
        if (!this.client) {
            // Return mock data if no client configured (for dev/demo without keys)
            // or throw error? For Web-First dev, mock is better.
            console.warn("OpenAI Client not initialized, returning mock suggestions.");
            return this.mockSuggestions(files);
        }

        // TODO: Implement real LLM Call with Structured Output
        // For now, returning mock to save tokens as per plan
        return this.mockSuggestions(files);
    }

    private mockSuggestions(files: FileMetadata[]): OrganizationSuggestion[] {
        return files.map(f => {
            const isProject = f.content.includes('project');
            const isPersonal = f.content.includes('milk') || f.content.includes('personal');

            return {
                path: f.path,
                folderSuggestions: [
                    {
                        folder: isProject ? '2. Areas/Projects' : 'Resources/Notes',
                        reason: isProject
                            ? '内容包含项目相关关键词，适合放在项目区域'
                            : '一般性笔记内容，建议放在资源区'
                    },
                    {
                        folder: isPersonal ? '3. Personal/Life' : '2. Areas/Work',
                        reason: isPersonal
                            ? '包含个人生活相关内容'
                            : '可能与工作相关的内容'
                    },
                    {
                        folder: 'Archive/2024',
                        reason: '如果这是旧内容，可以考虑存档'
                    }
                ],
                selectedFolderIndex: 0,
                tags: isPersonal
                    ? ['#personal', '#todo', '#review']
                    : ['#work', '#notes'],
                area: isProject ? 'Project Alpha' : undefined
            };
        });
    }
}
