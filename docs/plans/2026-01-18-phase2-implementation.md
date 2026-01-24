# [Second Brain Manager Phase 2] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade to "Second Brain Manager" with robust Vercel AI SDK integration and a dedicated Chat UI for connectivity testing.

**Architecture:** Web-First with Adapter Pattern. Frontend uses `ai` + `React` for UI. AI Service uses `@ai-sdk/openai` + `Core` APIs for streaming in Obsidian's Node-less environment.

**Tech Stack:** React 18, TypeScript, Vercel AI SDK (Core + OpenAI), Obsidian API.

---

### Task 1: Infrastructure & Configuration

**Files:**
- Modify: `package.json`
- Modify: `manifest.json`
- Modify: `src/main.ts`
- Modify: `src/components/SettingsForm.tsx`

**Step 1.1: Install Dependencies**
Run: `npm install ai @ai-sdk/openai zod`
Expected: Dependencies added to package.json

**Step 1.2: Update Manifest Metadata**
File: `manifest.json`
```json
{
  "id": "obsidian-second-brain-manager",
  "name": "Second Brain Manager",
  "version": "1.1.0",
  "description": "Your AI-powered Second Brain: Inbox organization, Chat, and more.",
  "isDesktopOnly": false
}
```

**Step 1.3: Update Settings Type**
File: `src/main.ts` (Update PluginSettings interface)
```typescript
interface PluginSettings {
    apiKey: string;
    baseURL: string;
    inboxPath: string;
    modelName: string; // Add this
}
```

**Step 1.4: Update Default Settings**
File: `src/main.ts`
```typescript
const DEFAULT_SETTINGS: PluginSettings = {
    apiKey: '',
    baseURL: '',
    inboxPath: 'Inbox',
    modelName: 'gpt-3.5-turbo'
}
```

**Step 1.5: Update Settings UI**
File: `src/components/SettingsForm.tsx`
- Add `modelName` field to `SettingsConfig` interface
- Add Input field for `Model Name` in the form
- Pass `modelName` in `onSave`

---

### Task 2: AI Service Implementation (Vercel AI SDK)

**Files:**
- Create: `src/services/AIService.ts`
- Test: `tests/services/AIService.test.ts` (Simulated)

**Step 2.1: Write the Test**
File: `tests/services/AIService.test.ts`
```typescript
// Ideally using vitest, but describing logic here
import { AIService } from '../../src/services/AIService';

describe('AIService', () => {
    it('should be instantiable', () => {
        const service = new AIService({ apiKey: 'test', baseURL: 'test', modelName: 'test' });
        expect(service).toBeTruthy();
    });
});
```

**Step 2.2: Implement AIService Skeleton**
File: `src/services/AIService.ts`
```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, CoreMessage } from 'ai';

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

    async streamChat(messages: CoreMessage[], onDelta: (chunk: string) => void, onError: (err: any) => void) {
       // Implementation in next step
    }
}
```

**Step 2.3: Implement Stream Logic**
File: `src/services/AIService.ts` (Fill streamChat)
```typescript
    async streamChat(messages: CoreMessage[], onDelta: (chunk: string) => void, onError: (err: any) => void) {
        try {
            const openai = createOpenAI({
                apiKey: this.config.apiKey,
                baseURL: this.config.baseURL || undefined,
                 // Important for Obsidian environment
                fetch: (url, init) => fetch(url, init) 
            });

            const result = await streamText({
                model: openai(this.config.modelName),
                messages,
            });

            for await (const delta of result.textStream) {
                onDelta(delta);
            }
        } catch (error) {
            onError(error);
        }
    }
```

---

### Task 3: Chat UI Components (Web-First)

**Files:**
- Create: `src/components/chat/MessageList.tsx`
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/components/chat/ChatPanel.tsx`

**Step 3.1: MessageList Component**
File: `src/components/chat/MessageList.tsx`
```tsx
import React from 'react';
import { CoreMessage } from 'ai';

export const MessageList: React.FC<{ messages: CoreMessage[] }> = ({ messages }) => {
    return (
        <div className="chat-message-list" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.role}`} style={{ 
                    marginBottom: '10px', 
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    background: m.role === 'user' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                    padding: '8px',
                    borderRadius: '8px'
                }}>
                    <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content as string}</div>
                </div>
            ))}
        </div>
    );
};
```

**Step 3.2: ChatInput Component**
File: `src/components/chat/ChatInput.tsx`
```tsx
import React, { useState } from 'react';

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim() && !disabled) {
                onSend(text);
                setText('');
            }
        }
    };

    return (
        <div className="chat-input-area" style={{ padding: '10px', borderTop: '1px solid var(--background-modifier-border)' }}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder="Type a message..."
                style={{ width: '100%', minHeight: '50px' }}
            />
        </div>
    );
};
```

**Step 3.3: ChatPanel Container**
File: `src/components/chat/ChatPanel.tsx`
```tsx
import React, { useState } from 'react';
import { CoreMessage } from 'ai';
import { AIService } from '../../services/AIService';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export const ChatPanel: React.FC<{ aiService: AIService }> = ({ aiService }) => {
    const [messages, setMessages] = useState<CoreMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (text: string) => {
        const userMsg: CoreMessage = { role: 'user', content: text };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setIsLoading(true);

        // Placeholder for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        await aiService.streamChat(
            newHistory, 
            (delta) => {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    // Create new array with updated last message
                     const updated = [...prev];
                     updated[updated.length - 1] = { ...last, content: (last.content as string) + delta };
                     return updated;
                });
            },
            (err) => {
                console.error(err);
                setMessages(prev => [...prev, { role: 'system', content: `Error: ${err.message}` }]);
                setIsLoading(false);
            }
        );
        setIsLoading(false);
    };

    return (
        <div className="chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <MessageList messages={messages} />
            <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
    );
};
```

---

### Task 4: Obsidian Integration & Wiring

**Files:**
- Create: `src/views/ChatView.ts`
- Modify: `src/main.ts`

**Step 4.1: Create ChatView**
File: `src/views/ChatView.ts`
```typescript
import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatPanel } from '../components/chat/ChatPanel';
import { AIService } from '../services/AIService';
import InboxPlugin from '../main';

export const VIEW_TYPE_CHAT = 'second-brain-chat-view';

export class ChatView extends ItemView {
    root: Root | null = null;
    plugin: InboxPlugin;
    aiService: AIService;

    constructor(leaf: WorkspaceLeaf, plugin: InboxPlugin) {
        super(leaf);
        this.plugin = plugin;
        // Initialize service with current settings
        this.aiService = new AIService(plugin.settings); 
    }

    getViewType() { return VIEW_TYPE_CHAT; }
    getDisplayText() { return 'Assistant'; }
    getIcon() { return 'bot'; }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        const reactContainer = container.createDiv();
        this.root = createRoot(reactContainer);

        this.root.render(
            <ChatPanel aiService={this.aiService} />
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}
```

**Step 4.2: Register View in Plugin**
File: `src/main.ts`
- Import `ChatView`
- `registerView` in `onload`
- Add Ribbon Icon ('bot') to `activateView`
- Ensure `saveSettings` updates the `aiService` config if needed (or Service reads reference)

---

### Verification
1. `npm run dev` -> Check Web Entry (need to add Chat Mode output there temporarily for testing).
2. `npm run build` -> `npm run dev:plugin`.
3. Open Obsidian -> Click Bot Icon -> Send Message -> Observe Stream.
