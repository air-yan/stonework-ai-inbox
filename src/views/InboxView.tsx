import React, { useEffect, useState, useCallback } from 'react';
import { DataProvider, FileMetadata, OrganizationSuggestion } from '../adapters/types';
import { PARAService, AIConfig } from '../services/PARAService';
import { OrganizationalTable } from '../components/OrganizationalTable';
import { ToastContainer, ToastType } from '../components/Toast';

// 默认 AI 配置（可从设置中获取）
const DEFAULT_AI_CONFIG: AIConfig = {
    apiKey: '',  // 需要用户配置
    baseURL: 'https://openrouter.ai/api/v1',
    modelName: 'anthropic/claude-3.5-sonnet'  // 默认模型
};

interface InboxViewProps {
    adapter: DataProvider;
    aiConfig?: AIConfig;
    inboxPath?: string;
}

const TEXT = {
    en: {
        scanAllBtn: 'Scan all with AI',
        scanningStatus: 'Scanning',
        proFeature: '🔒 Premium Feature - Coming Soon',
        duplicateFileError: 'Move failed: A file with the same name already exists at',
        moveFailedError: 'Move failed'
    },
    zh: {
        scanAllBtn: '批量 AI 扫描',
        scanningStatus: '扫描中',
        proFeature: '🔒 高级功能 - 即将推出',
        duplicateFileError: '移动失败：目标位置已存在同名文件',
        moveFailedError: '移动失败'
    }
};

export const InboxView: React.FC<InboxViewProps> = ({ adapter, aiConfig, inboxPath = 'Inbox' }) => {
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [suggestions, setSuggestions] = useState<OrganizationSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanningPaths, setScanningPaths] = useState<string[]>([]);
    const [allFolders, setAllFolders] = useState<string[]>([]);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
    const t = TEXT[aiConfig?.language || 'en'];

    const showToast = (message: string, type: ToastType = 'error') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // PARA 分析服务
    const [paraService] = useState(() => new PARAService(aiConfig || DEFAULT_AI_CONFIG));

    // 更新 PARAService 配置
    useEffect(() => {
        if (aiConfig) {
            paraService.updateConfig(aiConfig);
        }
    }, [aiConfig, paraService]);

    const refreshFiles = useCallback(async () => {
        const loadedFiles = await adapter.loadInboxFiles(inboxPath);
        setFiles(loadedFiles);
        // Load folders for autocomplete
        const folders = adapter.getAllFolders();
        setAllFolders(folders);
    }, [adapter, inboxPath]);

    // Initial load
    useEffect(() => {
        refreshFiles();
    }, [refreshFiles]);

    // Real-time file watching - auto refresh when Inbox changes
    useEffect(() => {
        const unsubscribe = adapter.onInboxChange(inboxPath, () => {
            refreshFiles();
        });
        return unsubscribe;
    }, [adapter, inboxPath, refreshFiles]);

    // 批量扫描 - 每次 3 个并发
    const handleScanAll = async () => {
        const filesToScan = files.filter(f => !suggestions.find(s => s.path === f.path));
        if (filesToScan.length === 0) return;

        setLoading(true);
        const batchSize = 3;

        try {
            for (let i = 0; i < filesToScan.length; i += batchSize) {
                const batch = filesToScan.slice(i, i + batchSize);
                // 并发执行这一批
                await Promise.all(batch.map(f => handleScanRow(f.path, f.content)));
            }
        } catch (error) {
            // Batch scan failed silently
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

            // 调用 PARA 服务分析
            const result = await paraService.analyzeDocument(content, allTags, folderTree);

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
            // Scan row failed silently
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


        try {
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
        } catch (error: any) {
            // Check if it's a duplicate file error
            if (error?.message?.startsWith('DUPLICATE_FILE:')) {
                const targetPath = error.message.replace('DUPLICATE_FILE:', '');
                showToast(`${t.duplicateFileError}\n${targetPath}`, 'error');
            } else {
                showToast(`${t.moveFailedError}: ${error?.message || 'Unknown error'}`, 'error');
            }
        }
    };

    const handleIgnore = (path: string) => {
        setSuggestions(prev => prev.filter(s => s.path !== path));
    };

    return (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <div className="inbox-view">
                <div className="inbox-view-header">
                    <h1>Inbox organizer <span className="version">v0.1.0</span></h1>
                <div className="inbox-view-actions">
                    {loading && (
                        <span className="inbox-view-status">
                            Scanning {scanningPaths.length} files...
                        </span>
                    )}
                    <button
                        onClick={handleScanAll}
                        disabled={true}
                        className="btn-primary btn-pro-disabled"
                        title={t.proFeature}
                    >
                        <svg
                            className="btn-icon"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                        <span className="btn-text">{t.scanAllBtn}</span>
                        <span className="btn-pro-badge">Pro</span>
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
                    onOpenFile={(path) => adapter.openFile(path)}
                />
            )}
            </div>
        </>
    );
};
