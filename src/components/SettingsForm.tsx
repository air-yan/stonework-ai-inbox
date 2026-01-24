import React, { useState } from 'react';

interface SettingsFormProps {
    initialApiKey?: string;
    initialBaseUrl?: string;
    initialInboxPath?: string;
    initialModelName?: string;
    initialLanguage?: 'en' | 'zh';
    onSave: (config: { apiKey: string; baseURL: string; inboxPath: string; modelName: string; language: 'en' | 'zh' }) => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
    initialApiKey = '',
    initialBaseUrl = '',
    initialInboxPath = 'Inbox',
    initialModelName = 'gpt-3.5-turbo',
    initialLanguage = 'en',
    onSave
}) => {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [baseURL, setBaseURL] = useState(initialBaseUrl);
    const [inboxPath, setInboxPath] = useState(initialInboxPath);
    const [modelName, setModelName] = useState(initialModelName);
    const [language, setLanguage] = useState<'en' | 'zh'>(initialLanguage);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ apiKey, baseURL, inboxPath, modelName, language });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
            <h3>Settings</h3>

            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Language / 语言</label>
                <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as 'en' | 'zh')}
                    style={{ width: '100%', padding: '8px' }}
                >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>OpenAI API Key</label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Base URL (Optional)</label>
                <input
                    type="text"
                    value={baseURL}
                    onChange={e => setBaseURL(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Model Name</label>
                <input
                    type="text"
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    placeholder="gpt-3.5-turbo, claude-3-opus, etc."
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Inbox Path</label>
                <input
                    type="text"
                    value={inboxPath}
                    onChange={e => setInboxPath(e.target.value)}
                    placeholder="Inbox"
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>

            <button
                type="submit"
                style={{ background: '#7a51d1', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
            >
                Save Configuration
            </button>
        </form>
    );
};
