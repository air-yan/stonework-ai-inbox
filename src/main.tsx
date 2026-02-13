import { App, Plugin, PluginSettingTab, WorkspaceLeaf, ItemView, Notice } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { InboxView } from './views/InboxView';
import { SettingsForm } from './components/SettingsForm';
import { ObsAdapter } from './adapters/ObsAdapter';

const VIEW_TYPE_INBOX = 'inbox-organizer-view';

interface PluginSettings {
    apiKey: string;
    baseURL: string;
    inboxPath: string;
    modelName: string;
    language: 'en' | 'zh';
}

const DEFAULT_SETTINGS: PluginSettings = {
    apiKey: '',
    baseURL: '',
    inboxPath: 'Inbox',
    modelName: 'gpt-3.5-turbo',
    language: 'en'
}

export default class InboxPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_INBOX,
            (leaf) => new InboxViewLeaf(leaf, this)
        );

        this.addRibbonIcon('archive', 'Open inbox organizer', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-inbox-organizer',
            name: 'Open inbox organizer',
            callback: () => this.activateView()
        });

        this.addSettingTab(new InboxSettingTab(this.app, this));
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_INBOX);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Refresh all open views to apply new settings
        this.refreshAllViews();
    }

    refreshAllViews() {
        this.app.workspace.getLeavesOfType(VIEW_TYPE_INBOX).forEach(leaf => {
            const view = leaf.view as InboxViewLeaf;
            if (view && view.refresh) {
                view.refresh();
            }
        });
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_INBOX);

        if (leaves.length > 0) {
            let l = leaves[0];
            workspace.revealLeaf(l);
            leaf = l;
        } else {
            leaf = workspace.getLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_INBOX, active: true });
            workspace.revealLeaf(leaf);
        }
    }

}

class InboxViewLeaf extends ItemView {
    plugin: InboxPlugin;
    root: Root | null = null;
    adapter: ObsAdapter;

    constructor(leaf: WorkspaceLeaf, plugin: InboxPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.adapter = new ObsAdapter(this.app);
    }

    getViewType() {
        return VIEW_TYPE_INBOX;
    }

    getDisplayText() {
        return 'Stonework AI: Inbox';
    }

    private getAiConfig() {
        return {
            apiKey: this.plugin.settings.apiKey,
            baseURL: this.plugin.settings.baseURL,
            modelName: this.plugin.settings.modelName,
            language: this.plugin.settings.language
        };
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        const reactContainer = container.createDiv();
        this.root = createRoot(reactContainer);
        this.renderView();
    }

    private renderView() {
        if (!this.root) return;

        this.root.render(
            <InboxView
                adapter={this.adapter}
                aiConfig={this.getAiConfig()}
                inboxPath={this.plugin.settings.inboxPath}
            />
        );
    }

    // Called when settings change to refresh the view
    refresh() {
        this.renderView();
    }

    async onClose() {
        if (this.root) {
            this.root.unmount();
        }
    }
}

class InboxSettingTab extends PluginSettingTab {
    plugin: InboxPlugin;
    root: Root | null = null;

    constructor(app: App, plugin: InboxPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const reactContainer = containerEl.createDiv();
        this.root = createRoot(reactContainer);

        this.root.render(
            <SettingsForm
                initialApiKey={this.plugin.settings.apiKey}
                initialBaseUrl={this.plugin.settings.baseURL}
                initialInboxPath={this.plugin.settings.inboxPath}
                initialModelName={this.plugin.settings.modelName}
                initialLanguage={this.plugin.settings.language}
                allFolders={new ObsAdapter(this.app).getAllFolders()}
                onSave={async (config) => {
                    this.plugin.settings.apiKey = config.apiKey;
                    this.plugin.settings.baseURL = config.baseURL;
                    this.plugin.settings.inboxPath = config.inboxPath;
                    this.plugin.settings.modelName = config.modelName;
                    this.plugin.settings.language = config.language;
                    await this.plugin.saveSettings();
                    // Show notification
                    new Notice('Settings saved!');
                }}
            />
        );
    }

    hide() {
        if (this.root) {
            this.root.unmount();
        }
    }
}
