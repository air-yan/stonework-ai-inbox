import React, { useEffect, useState, useCallback } from 'react';
import { DataProvider, FileMetadata, OrganizationSuggestion } from '../adapters/types';
import { OpenAIService } from '../services/OpenAIService';
import { PARAService, AIConfig } from '../services/PARAService';
import { OrganizationalTable } from '../components/OrganizationalTable';

// 默认 AI 配置（可从设置中获取）
const DEFAULT_AI_CONFIG: AIConfig = {
    apiKey: '',  // 需要用户配置
    baseURL: 'https://openrouter.ai/api/v1',
    modelName: 'anthropic/claude-3.5-sonnet'  // 默认模型
};

interface InboxViewProps {
    adapter: DataProvider;
    aiConfig?: AIConfig;
}

export const InboxView: React.FC<InboxViewProps> = ({ adapter, aiConfig }) => {
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [suggestions, setSuggestions] = useState<OrganizationSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanningPaths, setScanningPaths] = useState<string[]>([]);
    const [allFolders, setAllFolders] = useState<string[]>([]);
    const [llmService] = useState(() => new OpenAIService());

    // PARA 分析服务
    const [paraService] = useState(() => new PARAService(aiConfig || DEFAULT_AI_CONFIG));

    // 更新 PARAService 配置
    useEffect(() => {
        if (aiConfig) {
            paraService.updateConfig(aiConfig);
        }
    }, [aiConfig, paraService]);

    const refreshFiles = useCallback(async () => {
        const loadedFiles = await adapter.loadInboxFiles('Inbox');
        setFiles(loadedFiles);
        // Load folders for autocomplete
        const folders = adapter.getAllFolders();
        setAllFolders(folders);
    }, [adapter]);

    // Initial load
    useEffect(() => {
        refreshFiles();
    }, [refreshFiles]);

    // Real-time file watching - auto refresh when Inbox changes
    useEffect(() => {
        const unsubscribe = adapter.onInboxChange('Inbox', () => {
            console.log('[InboxView] Inbox changed, refreshing...');
            refreshFiles();
        });
        return unsubscribe;
    }, [adapter, refreshFiles]);

    // 批量扫描 - 每次 3 个并发
    const handleScanAll = async () => {
        const filesToScan = files.filter(f => !suggestions.find(s => s.path === f.path));
        if (filesToScan.length === 0) return;

        setLoading(true);
        const batchSize = 3;

        try {
            for (let i = 0; i < filesToScan.length; i += batchSize) {
                const batch = filesToScan.slice(i, i + batchSize);
                console.log(`[InboxView] Scanning batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filesToScan.length / batchSize)}: ${batch.map(f => f.name).join(', ')}`);
                // 并发执行这一批
                await Promise.all(batch.map(f => handleScanRow(f.path, f.content)));
            }
        } catch (error) {
            console.error('[InboxView] Batch scan failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // 逐行 AI 扫描
    const handleScanRow = async (path: string, content: string) => {
        // 标记该行为扫描中
        setScanningPaths(prev => [...prev, path]);

        try {
            // 获取 vault 的 tags 和 filetree - 仅获取文件夹结构
            const allTags = adapter.getAllTags();
            const folderTree = adapter.getFolderTree();

            console.log('[InboxView] Scanning row:', path);
            console.log('[InboxView] Tags:', allTags);
            console.log('[InboxView] FolderTree:', folderTree);

            // 调用 PARA 服务分析
            const result = await paraService.analyzeDocument(content, allTags, folderTree);

            console.log('[InboxView] PARA result:', result);

            // 构建 suggestion 并更新状态
            const suggestion: OrganizationSuggestion = {
                path,
                folderSuggestions: result.folderSuggestions,
                selectedFolderIndex: 0,
                tags: result.tags,
                newTags: result.newTags, // 传递新标签信息
                reason: result.reason
            };

            setSuggestions(prev => {
                // 移除旧的建议（如果有）
                const filtered = prev.filter(s => s.path !== path);
                return [...filtered, suggestion];
            });
        } catch (error) {
            console.error('[InboxView] Scan row failed:', error);
        } finally {
            // 移除扫描中状态
            setScanningPaths(prev => prev.filter(p => p !== path));
        }
    };

    const handleMove = async (path: string, suggestion: OrganizationSuggestion) => {
        // Priority: targetFolder (set by handleAccept with manual priority) > AI suggestion
        const targetFolder = suggestion.targetFolder
            || suggestion.folderSuggestions[suggestion.selectedFolderIndex]?.folder
            || '';

        console.log(`Moving ${path} to ${targetFolder}`);

        // Update frontmatter first (while file is still at path)
        await adapter.updateFrontmatter(path, {
            tags: suggestion.tags,
            area: suggestion.area,
            reason: suggestion.reason // Save AI reason to frontmatter
        });
        // Execute move via adapter
        await adapter.moveFile(path, `${targetFolder}/${path.split('/').pop()}`);

        // Remove from local list to reflect change immediately
        setFiles(prev => prev.filter(f => f.path !== path));
        setSuggestions(prev => prev.filter(s => s.path !== path));
    };

    const handleIgnore = (path: string) => {
        setSuggestions(prev => prev.filter(s => s.path !== path));
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Inbox Organizer <span style={{ fontSize: '0.6em', color: 'var(--text-muted)' }}>v1.3.0</span></h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {loading && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
                            Scanning {scanningPaths.length} files...
                        </span>
                    )}
                    <button
                        onClick={handleScanAll}
                        disabled={loading || files.length === 0}
                        style={{
                            background: 'var(--interactive-accent)',
                            color: 'var(--text-on-accent)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Scanning...' : 'Scan All with AI'}
                    </button>
                </div>
            </div>

            {files.length === 0 ? (
                <p>No files in Inbox.</p>
            ) : (
                <OrganizationalTable
                    files={files}
                    suggestions={suggestions}
                    onMove={handleMove}
                    onIgnore={handleIgnore}
                    onScanRow={handleScanRow}
                    scanningPaths={scanningPaths}
                    language={aiConfig?.language || 'en'}
                    allFolders={allFolders}
                />
            )}
        </div>
    );
};
