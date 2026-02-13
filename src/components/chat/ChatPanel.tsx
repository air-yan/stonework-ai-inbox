import React, { useState } from 'react';
import { AIService, CoreMessage } from '../../services/AIService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Utils } from '../../tools/ObsidianTools';
import { App } from 'obsidian';

export const ChatPanel: React.FC<{ aiService: AIService; app?: App }> = ({ aiService, app }) => {
    const [messages, setMessages] = useState<CoreMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (text: string) => {
        // Special Command: /test-tools
        if (text === '/test-tools' && app) {
            setMessages(prev => [...prev, { role: 'user', content: text }]);
            try {
                const tree = Utils.getFileTree(app);
                const tags = Utils.getAllTags(app);

                const output = `**Tool Output Verification**\n\n**File Tree:**\n\`\`\`\n${tree}\n\`\`\`\n\n**Tags:**\n${tags.join(', ') || 'No tags found'}`;

                setMessages(prev => [...prev, { role: 'system', content: output }]);
            } catch (err: any) {
                setMessages(prev => [...prev, { role: 'system', content: `Tool Error: ${err.message}` }]);
            }
            return;
        }

        const userMsg: CoreMessage = { role: 'user', content: text };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setIsLoading(true);

        // Placeholder for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        let fullResponse = '';

        // Sliding window: Open context to last 15 messages
        const contextMessages = newHistory.slice(-15);

        await aiService.streamChat(
            contextMessages,
            (delta) => {
                fullResponse += delta;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: fullResponse };
                    return updated;
                });
            },
            (err) => {
                setMessages(prev => [...prev, { role: 'system', content: `Error: ${err.message || 'Unknown error'}` }]);
                setIsLoading(false);
            }
        );
        setIsLoading(false);
    };

    return (
        <div className="sai-chat-panel">
            <MessageList messages={messages} />
            <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
    );
};
