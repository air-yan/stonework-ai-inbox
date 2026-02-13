import React, { useState, useEffect } from 'react';

const TEXT = {
    en: {
        title: 'Second brain manager settings',
        tabs: {
            general: 'General',
            aiModel: 'AI Model',
            inbox: 'Inbox'
        },
        general: 'General',
        aiModel: 'AI Model',
        inboxManager: 'Inbox Manager',
        language: 'Language / 语言',
        languageDesc: 'Choose your preferred language for the interface',
        apiKey: 'API Key',
        apiKeyDesc: 'Your OpenAI or compatible API key',
        baseUrl: 'Base URL',
        baseUrlDesc: 'Custom API endpoint (leave empty for OpenAI default)',
        modelName: 'Model Name',
        modelNameDesc: 'The model to use for AI analysis',
        inboxPath: 'Inbox Path',
        inboxPathDesc: 'The folder path to monitor for new notes',
        autoSaveNotice: '✓ Settings are saved automatically',
        recommendation: 'Recommended: OpenRouter + gemini-3-flash-preview'
    },
    zh: {
        title: '第二大脑管理器设置',
        tabs: {
            general: '常规',
            aiModel: 'AI 模型',
            inbox: 'Inbox'
        },
        general: '常规',
        aiModel: 'AI 模型',
        inboxManager: 'Inbox 管理器',
        language: 'Language / 语言',
        languageDesc: '选择界面语言',
        apiKey: 'API 密钥',
        apiKeyDesc: '你的 OpenAI 或兼容服务的 API 密钥',
        baseUrl: '基础 URL',
        baseUrlDesc: '自定义 API 端点（留空使用 OpenAI 默认值）',
        modelName: '模型名称',
        modelNameDesc: '用于 AI 分析的模型',
        inboxPath: 'Inbox 路径',
        inboxPathDesc: '监控新笔记的文件夹路径',
        autoSaveNotice: '✓ 设置已自动保存',
        recommendation: '推荐配置: OpenRouter + gemini-3-flash-preview'
    }
};

interface SettingsFormProps {
    initialApiKey?: string;
    initialBaseUrl?: string;
    initialInboxPath?: string;
    initialModelName?: string;
    initialLanguage?: 'en' | 'zh';
    allFolders?: string[];
    onSave: (config: { apiKey: string; baseURL: string; inboxPath: string; modelName: string; language: 'en' | 'zh' }) => void;
}

// Section Header Component
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h4 className="sai-settings-section-header">{title}</h4>
);

// Setting Item Component
const SettingItem: React.FC<{
    label: string;
    description?: string;
    children: React.ReactNode
}> = ({ label, description, children }) => (
    <div className="sai-settings-item">
        <label>{label}</label>
        {description && <div className="sai-description">{description}</div>}
        {children}
    </div>
);

export const SettingsForm: React.FC<SettingsFormProps> = ({
    initialApiKey = '',
    initialBaseUrl = '',
    initialInboxPath = 'Inbox',
    initialModelName = 'gpt-3.5-turbo',
    initialLanguage = 'en',
    allFolders = [],
    onSave
}) => {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [baseURL, setBaseURL] = useState(initialBaseUrl);
    const [inboxPath, setInboxPath] = useState(initialInboxPath);
    const [modelName, setModelName] = useState(initialModelName);
    const [language, setLanguage] = useState<'en' | 'zh'>(initialLanguage);
    const [activeTab, setActiveTab] = useState<'general' | 'aiModel' | 'inbox'>('general');
    const t = TEXT[language];

    // Folder autocomplete state
    const [showFolderSuggestions, setShowFolderSuggestions] = useState(false);
    const [folderSearch, setFolderSearch] = useState('');

    const filteredFolders = allFolders.filter(f =>
        f.toLowerCase().includes(inboxPath.toLowerCase())
    ).slice(0, 8);

    // Auto-save on any change (debounced to avoid excessive saves)
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Skip first render to avoid saving initial values
        if (!isInitialized) {
            setIsInitialized(true);
            return;
        }

        // Debounce: save after 500ms of no changes
        const timeoutId = setTimeout(() => {
            onSave({ apiKey, baseURL, inboxPath, modelName, language });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [apiKey, baseURL, inboxPath, modelName, language, onSave, isInitialized]);

    const handleFolderSelect = (folder: string) => {
        setInboxPath(folder);
        setShowFolderSuggestions(false);
    };

    return (
        <div className="sai-settings-form">
            {/* Tab Navigation */}
            <div className="sai-settings-tabs">
                <button
                    className={`sai-settings-tab ${activeTab === 'general' ? 'sai-active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    {t.tabs.general}
                </button>
                <button
                    className={`sai-settings-tab ${activeTab === 'aiModel' ? 'sai-active' : ''}`}
                    onClick={() => setActiveTab('aiModel')}
                >
                    {t.tabs.aiModel}
                </button>
                <button
                    className={`sai-settings-tab ${activeTab === 'inbox' ? 'sai-active' : ''}`}
                    onClick={() => setActiveTab('inbox')}
                >
                    {t.tabs.inbox}
                </button>
            </div>

            {/* Tab Content */}
            <div className="sai-settings-tab-content">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="sai-settings-tab-panel">
                        <SettingItem label={t.language} description={t.languageDesc}>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value as 'en' | 'zh')}
                                className="sai-settings-select"
                            >
                                <option value="en">English</option>
                                <option value="zh">中文 (Chinese)</option>
                            </select>
                        </SettingItem>
                    </div>
                )}

                {/* AI Model Tab */}
                {activeTab === 'aiModel' && (
                    <div className="sai-settings-tab-panel">
                        <div style={{
                            marginBottom: '20px',
                            padding: '10px 12px',
                            background: 'rgba(var(--interactive-accent-rgb), 0.1)',
                            border: '1px solid var(--interactive-accent)',
                            borderRadius: '6px',
                            color: 'var(--text-normal)',
                            fontSize: '0.9em',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            <strong>{t.recommendation}</strong>
                        </div>

                        <SettingItem label={t.apiKey} description={t.apiKeyDesc}>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="sai-settings-input"
                            />
                        </SettingItem>

                        <SettingItem label={t.baseUrl} description={t.baseUrlDesc}>
                            <input
                                type="text"
                                value={baseURL}
                                onChange={e => setBaseURL(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="sai-settings-input"
                            />
                        </SettingItem>

                        <SettingItem label={t.modelName} description={t.modelNameDesc}>
                            <input
                                type="text"
                                value={modelName}
                                onChange={e => setModelName(e.target.value)}
                                placeholder="gpt-3.5-turbo, claude-3-opus, etc."
                                className="sai-settings-input"
                            />
                        </SettingItem>
                    </div>
                )}

                {/* Inbox Tab */}
                {activeTab === 'inbox' && (
                    <div className="sai-settings-tab-panel">
                        <SettingItem label={t.inboxPath} description={t.inboxPathDesc}>
                            <div className="sai-relative">
                                <input
                                    type="text"
                                    value={inboxPath}
                                    onChange={e => {
                                        setInboxPath(e.target.value);
                                        setShowFolderSuggestions(true);
                                    }}
                                    onFocus={() => setShowFolderSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowFolderSuggestions(false), 200)}
                                    placeholder="Inbox"
                                    className="sai-settings-input"
                                />
                                {/* Folder suggestions dropdown */}
                                {showFolderSuggestions && filteredFolders.length > 0 && (
                                    <div className="sai-settings-folder-suggestions">
                                        {filteredFolders.map(folder => (
                                            <div
                                                key={folder}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleFolderSelect(folder);
                                                }}
                                                className="sai-settings-folder-suggestion"
                                            >
                                                {folder}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SettingItem>
                    </div>
                )}
            </div>
        </div>
    );
};
