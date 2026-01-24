import React from 'react';
import { createRoot } from 'react-dom/client';
import { InboxView } from './views/InboxView';
import { WebAdapter } from './adapters/WebAdapter';
import { ChatPanel } from './components/chat/ChatPanel';
import { AIService, CoreMessage } from './services/AIService';
import { App, TFolder, TFile } from 'obsidian';

const root = createRoot(document.getElementById('root')!);

const WebApp = () => {

    // Real Service with User Credentials (DeepSeek v3.1 via OpenRouter)
    const aiService = new AIService({
        apiKey: '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',
        baseURL: 'https://openrouter.ai/api/v1',
        modelName: 'deepseek/deepseek-chat'
    });

    // Mock App for Tool Testing (Type cast to Obsidian App)
    const mockApp = {
        vault: {
            getRoot: () => ({
                children: [
                    { name: 'Inbox', children: [], path: 'Inbox' } as unknown as TFolder,
                    { name: 'Projects', children: [{ name: 'ProjectA.md', path: 'Projects/ProjectA.md' } as TFile], path: 'Projects' } as unknown as TFolder,
                    { name: 'Welcome.md', path: 'Welcome.md' } as TFile
                ]
            })
        },
        metadataCache: {
            getTags: () => ({ '#todo': 1, '#important': 2 })
        }
    } as unknown as App;

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <InboxView adapter={new WebAdapter()} />
            </div>
            <div style={{ width: '400px', borderLeft: '1px solid var(--background-modifier-border)' }}>
                <ChatPanel aiService={aiService} app={mockApp} />
            </div>
        </div>
    );
};

root.render(<WebApp />);
