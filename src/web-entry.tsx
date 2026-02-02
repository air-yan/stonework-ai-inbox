import React from 'react';
import { createRoot } from 'react-dom/client';
import { InboxView } from './views/InboxView';
import { WebAdapter } from './adapters/WebAdapter';
import { ChatPanel } from './components/chat/ChatPanel';
import { AIService, CoreMessage } from './services/AIService';
import { App, TFolder, TFile } from 'obsidian';

const root = createRoot(document.getElementById('root')!);

const WebApp = () => {

    // AI Service Configuration (use environment variable or configure in settings)
    // IMPORTANT: Never commit real API keys to version control!
    const aiService = new AIService({
        apiKey: import.meta.env.VITE_OPENROUTER_KEY || 'YOUR_API_KEY_HERE',
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
        <div className="web-app-layout">
            <div className="web-app-main">
                <InboxView adapter={new WebAdapter()} />
            </div>
            <div className="web-app-sidebar">
                <ChatPanel aiService={aiService} app={mockApp} />
            </div>
        </div>
    );
};

root.render(<WebApp />);
