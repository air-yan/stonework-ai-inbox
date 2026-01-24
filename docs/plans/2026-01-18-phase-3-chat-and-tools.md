# Phase 3: Conversational Intelligence & Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable multi-turn conversation memory and implement core Obsidian Tools (`getFileTree`, `getAllTags`) for the AI Assistant.

**Architecture:** 
- **Chat State**: Manage message history array in `ChatPanel` (React state), slicing to last 15 messages for context window.
- **Tools**: Create a `src/tools/ObsidianTools.ts` module that interfaces with `App` API (`vault`, `metadataCache`).
- **Testing**: Use unit tests for tool logic and a manual `/test-tools` command for integration verification.

**Tech Stack:** React, TypeScript, Obsidian API, Jest (for unit tests).

---

## Task 1: Multi-turn Chat Support

**Files:**
- Modify: `src/components/chat/ChatPanel.tsx`
- Modify: `src/services/AIService.ts` (if needed for type adjustments)

**Step 1: Write the failing test**
*Since ChatPanel is a UI component, we'll verify this by interaction or a component test if setup allows. For this plan, we will stick to implementation steps verified by the "Web Test".*

**Step 1.1: Verify current single-turn behavior**
- Run `npm run dev`.
- Send "My name is X".
- Send "What is my name?".
- Expected: AI forgets context (Single turn).

**Step 2: Implement Message History Logic**
- Update `handleSendMessage` in `ChatPanel.tsx`.
- Instead of passing only `[...messages, userMsg]`, ensure we append to the running list.
- Implement slicing: `const contextMessages = allMessages.slice(-15);`

**Step 3: Verification**
- Run `npm run dev`.
- Chat: "My name is John".
- Chat: "What is my name?".
- Expected: AI replies "Your name is John".

**Step 4: Commit**
```bash
git add src/components/chat/ChatPanel.tsx
git commit -m "feat: implement multi-turn chat with 15-message sliding window"
```

---

## Task 2: Implement Obsidian Tools

**Files:**
- Create: `src/tools/ObsidianTools.ts`
- Test: `tests/tools/ObsidianTools.test.ts` (Mocking Obsidian App)

**Step 1: Write the failing test for `getFileTree`**

```typescript
// tests/tools/ObsidianTools.test.ts
import { Utils } from '../../src/tools/ObsidianTools';
import { App, TFolder, TFile } from 'obsidian';

describe('ObsidianTools', () => {
    let mockApp: any;

    beforeEach(() => {
        mockApp = {
            vault: {
                getRoot: jest.fn(),
            },
            metadataCache: {
                getTags: jest.fn()
            }
        };
    });

    test('getFileTree returns Markdown list of files', () => {
        // Setup mock vault structure
        const root = {
            children: [
                { name: 'Folder A', children: [{ name: 'Note.md' } as TFile], path: 'Folder A' } as unknown as TFolder,
                { name: 'RootNote.md', path: 'RootNote.md' } as TFile
            ]
        } as unknown as TFolder;

        mockApp.vault.getRoot.mockReturnValue(root);

        const tree = Utils.getFileTree(mockApp);
        expect(tree).toContain('- Folder A/');
        expect(tree).toContain('  - Note.md');
        expect(tree).toContain('- RootNote.md');
    });
});
```

**Step 2: Run test to verify it fails**
Run: `npm test tests/tools/ObsidianTools.test.ts`
Expected: FAIL (Module not found)

**Step 3: Write implementation**

```typescript
// src/tools/ObsidianTools.ts
import { App, TAbstractFile, TFile, TFolder } from 'obsidian';

export class Utils {
    static getFileTree(app: App): string {
        const root = app.vault.getRoot();
        return this.traverseFolder(root, 0);
    }

    private static traverseFolder(folder: TFolder, depth: number): string {
        let output = '';
        const indent = '  '.repeat(depth);

        for (const child of folder.children) {
            if (child instanceof TFolder) {
                output += `${indent}- ${child.name}/\n`;
                output += this.traverseFolder(child, depth + 1);
            } else if (child instanceof TFile) {
                output += `${indent}- ${child.name}\n`;
            }
        }
        return output;
    }
    
    static getAllTags(app: App): string[] {
        // Placeholder for next step
        return [];
    }
}
```

**Step 4: Run test to verify it passes**
Run: `npm test tests/tools/ObsidianTools.test.ts`
Expected: PASS

**Step 5: Write failing test for `getAllTags`**

```typescript
    test('getAllTags returns unique list of tags', () => {
        mockApp.metadataCache.getTags.mockReturnValue({
            '#tag1': 1,
            '#tag2': 2,
            '#tag1': 3 // Verify uniqueness handling if API returns raw counts
        });
        
        // Mocking cache behavior where getTags returns Record<string, number>
        const tags = Utils.getAllTags(mockApp);
        expect(tags).toEqual(['#tag1', '#tag2']);
    });
```

**Step 6: Implement `getAllTags`**

```typescript
    static getAllTags(app: App): string[] {
        const tagsCache = app.metadataCache.getTags();
        if (!tagsCache) return [];
        return Object.keys(tagsCache);
    }
```

**Step 7: Verify all tests**
Run: `npm test`

**Step 8: Commit**
```bash
git add src/tools/ObsidianTools.ts tests/tools/ObsidianTools.test.ts
git commit -m "feat: implement getFileTree and getAllTags tools"
```

---

## Task 3: Integration & Testing Command

**Files:**
- Modify: `src/components/chat/ChatPanel.tsx`

**Step 1: Add `/test-tools` handling**

**Refactor `ChatPanel.tsx` logic:**
- Check if message equals `/test-tools`.
- If yes, do NOT call AI.
- Instead:
    - Call `adapter.getApp()` (Need to expose App via Adapter or pass it down).
    - **Wait**: `ChatPanel` runs in `obsidian` context within `ChatView`. We passed `plugin` to `ChatView`.
    - We might need to pass `app` instance to `ChatPanel` props or `AIService`.
    - *Correction*: `AIService` initializes with config. Use `ChatView` to inject a `ToolsService` or just pass `app` into `ChatPanel`?
    - **Better Approach**: Pass `app` from `ChatView` -> `ChatPanel`.

**Step 1.1: Update `ChatView.tsx` to pass `app`**
```typescript
<ChatPanel aiService={this.aiService} app={this.plugin.app} />
```

**Step 1.2: Update `ChatPanel` props**
```typescript
interface ChatPanelProps {
    aiService: AIService;
    app?: App; // Optional for Web Preview compatibility
}
```

**Step 1.3: Implement Command Logic**
```typescript
if (input === '/test-tools' && app) {
    const tree = Utils.getFileTree(app);
    const tags = Utils.getAllTags(app);
    const toolOutput = `**File Tree:**\n\`\`\`\n${tree}\n\`\`\`\n\n**Tags:**\n${tags.join(', ')}`;
    // Add SYSTEM message to chat
    setMessages(prev => [...prev, { role: 'system', content: toolOutput }]);
    return;
}
```

**Step 2: Commit**
```bash
git add src/views/ChatView.tsx src/components/chat/ChatPanel.tsx
git commit -m "feat: add /test-tools command for verification"
```
