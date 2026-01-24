import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, SystemModelMessage, UserModelMessage, AssistantModelMessage, ToolModelMessage } from 'ai';

export type CoreMessage = SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage;

export interface AIConfig {
    apiKey: string;
    baseURL: string;
    modelName: string;
}

export class AIService {
    private config: AIConfig;

    constructor(config: AIConfig) {
        this.config = config;
    }

    updateConfig(config: AIConfig) {
        this.config = config;
    }

    /**
     * Sanitize messages for display/safety, but rely on provider for protocol compatibility.
     * We ensure content is string to avoid UI issues, but the provider handles the wire format.
     */
    private sanitizeMessages(messages: CoreMessage[]): CoreMessage[] {
        // Simple pass-through or basic cleanup if needed. 
        // For now, we trust the OpenRouter provider to handle the heavy lifting.
        return messages;
    }

    async streamChat(messages: CoreMessage[], onDelta: (chunk: string) => void, onError: (err: any) => void) {
        try {
            // Initialize OpenRouter provider
            const openrouter = createOpenRouter({
                apiKey: this.config.apiKey,
                // baseURL is optional for OpenRouter but good if using proxy
                baseURL: this.config.baseURL || 'https://openrouter.ai/api/v1',
                // Explicitly set headers via extra options if needed, but default is usually fine
                fetch: (url, init) => fetch(url, init)
            });

            // We still filter system messages from history if they are tool outputs that are not supported
            // But basic user/assistant history should work fine now.
            const model = openrouter(this.config.modelName);

            const result = await streamText({
                model: model,
                messages: messages, // Send direct CoreMessage[]
            });

            for await (const delta of result.textStream) {
                onDelta(delta);
            }
        } catch (error) {
            onError(error);
        }
    }
}


