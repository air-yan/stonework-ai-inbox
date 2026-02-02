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

        // Ensure service config is up to date when view is opened
        this.aiService.updateConfig(this.plugin.settings);

        this.root.render(
            <ChatPanel aiService={this.aiService} app={this.plugin.app} />
        );
    }

    // Called when settings change to refresh the view
    refresh() {
        // Update AI service config with new settings
        this.aiService.updateConfig(this.plugin.settings);
    }

    async onClose() {
        if (this.root) {
            this.root.unmount();
        }
    }
}
