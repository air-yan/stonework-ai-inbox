# [Inbox Auto-Organizer] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Obsidian plugin that auto-organizes the Inbox folder using AI, featuring a Web-First architecture for rapid UI development.

**Architecture:** Web-First Strategy. The UI (React) interacts with a `DataProvider` interface. In the browser, a `WebAdapter` provides mock data. In Obsidian, an `ObsAdapter` bridges to the real Vault.

**Tech Stack:** React, TypeScript, Obsidian API, OpenAI API, Vite.

---

### Task 1: Project Scaffolding & Build System

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `manifest.json`
- Create: `vite.config.mjs`

**Step 1: Check environment**
Run: `node -v`
Expected: v16+

**Step 2: Create package.json**
File: `package.json`
```json
{
  "name": "obsidian-inbox-organizer",
  "version": "1.0.0",
  "description": "AI-powered inbox organization for Obsidian",
  "type": "module",
  "main": "main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "dev:plugin": "tsc -w"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "openai": "^4.0.0",
    "obsidian": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^16.0.0",
    "typescript": "^5.0.0",
    "tslib": "^2.0.0",
    "vite": "^5.0.0"
  }
}
```

**Step 3: Create tsconfig.json**
File: `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "jsx": "react-jsx",
    "lib": ["DOM", "ESNext"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**Step 4: Create manifest.json**
File: `manifest.json`
```json
{
  "id": "inbox-organizer",
  "name": "Inbox Manager",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "Auto-organize your inbox using AI",
  "author": "Antigravity",
  "isDesktopOnly": false
}
```

**Step 5: Install dependencies**
Run: `npm install`
Expected: Success

---

### Task 2: Core Architecture - Interfaces & Web Adapter

**Files:**
- Create: `src/adapters/types.ts`
- Create: `src/adapters/WebAdapter.ts`
- Create: `tests/adapters/WebAdapter.test.ts` (Simulated)

**Step 1: Define DataProvider Interface**
File: `src/adapters/types.ts`
```typescript
export interface FileMetadata {
  path: string;
  name: string;
  content: string;
}

export interface OrganizationSuggestion {
  path: string;
  targetFolder: string;
  tags: string[];
  area?: string;
  reason?: string;
}

export interface DataProvider {
  loadInboxFiles(inboxPath: string): Promise<FileMetadata[]>;
  moveFile(path: string, targetPath: string): Promise<void>;
  updateFrontmatter(path: string, data: Record<string, any>): Promise<void>;
}
```

**Step 2: Implement WebAdapter (Mock)**
File: `src/adapters/WebAdapter.ts`
```typescript
import { DataProvider, FileMetadata } from './types';

export class WebAdapter implements DataProvider {
  async loadInboxFiles(inboxPath: string): Promise<FileMetadata[]> {
    console.log(`[Mock] Loading files from ${inboxPath}`);
    return [
      { path: 'Inbox/Note1.md', name: 'Note1.md', content: 'Meeting notes about project Alpha' },
      { path: 'Inbox/Idea.md', name: 'Idea.md', content: 'Buy milk and eggs' }
    ];
  }

  async moveFile(path: string, targetPath: string): Promise<void> {
    console.log(`[Mock] Moving ${path} to ${targetPath}`);
  }

  async updateFrontmatter(path: string, data: Record<string, any>): Promise<void> {
    console.log(`[Mock] Updating frontmatter for ${path}:`, data);
  }
}
```

---

### Task 3: UI Scaffolding & Entry Point

**Files:**
- Create: `index.html`
- Create: `src/web-entry.tsx`
- Create: `src/components/Dashboard.tsx`

**Step 1: Create Index HTML**
File: `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inbox Organizer Dev</title>
  <style>
    body { background-color: #202020; color: #dcddde; font-family: sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/web-entry.tsx"></script>
</body>
</html>
```

**Step 2: Create Dashboard Component**
File: `src/components/Dashboard.tsx`
```tsx
import React, { useEffect, useState } from 'react';
import { DataProvider, FileMetadata } from '../adapters/types';

export const Dashboard: React.FC<{ adapter: DataProvider }> = ({ adapter }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);

  useEffect(() => {
    adapter.loadInboxFiles('Inbox').then(setFiles);
  }, [adapter]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Inbox Organizer</h1>
      <ul>
        {files.map(f => <li key={f.path}>{f.name}</li>)}
      </ul>
    </div>
  );
};
```

**Step 3: Create Web Entry**
File: `src/web-entry.tsx`
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/Dashboard';
import { WebAdapter } from './adapters/WebAdapter';

const root = createRoot(document.getElementById('root')!);
root.render(<Dashboard adapter={new WebAdapter()} />);
```

**Step 4: Verify Web Build**
Run: `npm run dev` (Manual verification)
Expected: Browser opens, showing "Note1.md" and "Idea.md".

---

### Task 4: LLM Service Integration

**Files:**
- Create: `src/services/OpenAIService.ts`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Create OpenAI Service**
File: `src/services/OpenAIService.ts`
```typescript
import OpenAI from 'openai';
import { FileMetadata, OrganizationSuggestion } from '../adapters/types';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true });
  }

  async generateSuggestions(files: FileMetadata[]): Promise<OrganizationSuggestion[]> {
    // Mock response for now to save tokens during dev
    if (files.length === 0) return [];
    
    return files.map(f => ({
      path: f.path,
      targetFolder: 'Resources',
      tags: ['#inbox'],
      reason: 'Automated suggestion'
    }));
  }
}
```

**(Tasks continues with Settings Form, Organizational Table, Obsidian Adapter integration...)**
*Note: Full plan truncated for brevity in this response, but would include all steps in the actual file.*
