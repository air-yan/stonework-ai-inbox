import React, { useState, useEffect } from 'react';
import { OrganizationSuggestion, FileMetadata, FolderSuggestion } from '../adapters/types';
import { TagsEditor } from './TagsEditor';

interface OrganizationalTableProps {
    files: FileMetadata[];
    suggestions: OrganizationSuggestion[];
    onMove: (path: string, suggestion: OrganizationSuggestion) => void;
    onIgnore: (path: string) => void;
    onSuggestionChange?: (path: string, suggestion: OrganizationSuggestion) => void;
    onScanRow?: (path: string, content: string) => void;
    scanningPaths?: string[];
}

interface EditableRow {
    selectedFolderIndex: number;
    tags: string[];
    manualFolderPath: string;  // User's manual folder selection
    showManualDropdown: boolean; // Whether to show manual folder dropdown
}

// Icons
const SparklesIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

const FolderIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
);

const ScanIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14m-7-7h14" />
    </svg>
);

const TEXT = {
    en: {
        file: 'File',
        manualFolder: 'Manual Folder',
        aiTargetFolder: 'AI Target Folder',
        tags: 'Tags',
        actions: 'Actions',
        aiScan: 'AI Scan',
        wait: 'Wait',
        accept: 'Accept',
        ignore: 'Ignore',
        selectFolder: 'Select folder...',
        searchFolder: 'Search folders...',
        analysing: 'Analysing content structure...',
        new: 'New',
        root: 'Root',
        reasonLabel: 'AI Reason',
        noSelection: 'Not selected'
    },
    zh: {
        file: '文件',
        manualFolder: '手动文件夹',
        aiTargetFolder: 'AI 目标文件夹',
        tags: '标签',
        actions: '操作',
        aiScan: 'AI 扫描',
        wait: '等待',
        accept: '接受',
        ignore: '忽略',
        selectFolder: '选择文件夹...',
        searchFolder: '搜索文件夹...',
        analysing: '正在分析内容结构...',
        new: '新增',
        root: '根目录',
        reasonLabel: 'AI 推荐理由',
        noSelection: '未选择'
    }
};

export const OrganizationalTable: React.FC<OrganizationalTableProps & { language?: 'en' | 'zh', allFolders?: string[] }> = ({
    files,
    suggestions,
    onMove,
    onIgnore,
    onScanRow,
    scanningPaths = [],
    language = 'en',
    allFolders = []
}) => {
    const [editState, setEditState] = useState<Record<string, EditableRow>>({});
    const [manualDropdownSearch, setManualDropdownSearch] = useState<Record<string, string>>({});
    const t = TEXT[language];

    // Initialize edit state for new files
    useEffect(() => {
        const newState: Record<string, EditableRow> = {};
        files.forEach(f => {
            if (!editState[f.path]) {
                newState[f.path] = {
                    selectedFolderIndex: 0,
                    tags: [],
                    manualFolderPath: '',
                    showManualDropdown: false
                };
            }
        });
        // Also update from suggestions - but PRESERVE manualFolderPath
        suggestions.forEach(s => {
            const existing = editState[s.path];
            if (existing) {
                // Only update AI-related fields, preserve manual selection
                newState[s.path] = {
                    ...existing,
                    selectedFolderIndex: s.selectedFolderIndex || 0,
                    tags: [...s.tags]
                    // manualFolderPath is preserved from existing state
                };
            } else if (!newState[s.path]) {
                newState[s.path] = {
                    selectedFolderIndex: s.selectedFolderIndex || 0,
                    tags: [...s.tags],
                    manualFolderPath: '',
                    showManualDropdown: false
                };
            }
        });
        if (Object.keys(newState).length > 0) {
            setEditState(prev => ({ ...prev, ...newState }));
        }
    }, [files, suggestions]);

    const getSuggestion = (path: string) => suggestions.find(s => s.path === path);
    const getEditState = (path: string): EditableRow | undefined => editState[path];

    const handleFolderSelect = (path: string, index: number) => {
        setEditState(prev => ({
            ...prev,
            [path]: { ...prev[path], selectedFolderIndex: index }
        }));
    };

    const handleTagsChange = (path: string, newTags: string[]) => {
        setEditState(prev => ({
            ...prev,
            [path]: { ...prev[path], tags: newTags }
        }));
    };

    const handleManualFolderSelect = (path: string, folder: string) => {
        setEditState(prev => ({
            ...prev,
            [path]: {
                ...prev[path],
                manualFolderPath: folder,
                showManualDropdown: false
            }
        }));
        setManualDropdownSearch(prev => ({ ...prev, [path]: '' }));
    };

    const toggleManualDropdown = (path: string) => {
        setEditState(prev => ({
            ...prev,
            [path]: {
                ...prev[path],
                showManualDropdown: !prev[path]?.showManualDropdown
            }
        }));
    };

    const clearManualFolder = (path: string) => {
        setEditState(prev => ({
            ...prev,
            [path]: { ...prev[path], manualFolderPath: '' }
        }));
    };

    const handleAccept = (path: string, suggestion?: OrganizationSuggestion) => {
        const edit = editState[path];
        if (!edit) return;

        // DEBUG: Log values
        console.log('[handleAccept] path:', path);
        console.log('[handleAccept] edit:', edit);
        console.log('[handleAccept] edit.manualFolderPath:', edit.manualFolderPath);
        console.log('[handleAccept] suggestion:', suggestion);

        // Priority: manual folder > AI suggestion
        const targetFolder = edit.manualFolderPath
            ? edit.manualFolderPath
            : suggestion?.folderSuggestions?.[edit.selectedFolderIndex]?.folder || '';

        console.log('[handleAccept] targetFolder:', targetFolder);

        if (!targetFolder) return;

        const modifiedSuggestion: OrganizationSuggestion = suggestion ? {
            ...suggestion,
            selectedFolderIndex: edit.selectedFolderIndex,
            tags: edit.tags,
            targetFolder
        } : {
            path,
            folderSuggestions: [{ folder: targetFolder, reason: 'Manual selection' }],
            selectedFolderIndex: 0,
            tags: edit.tags,
            targetFolder
        };
        onMove(path, modifiedSuggestion);
    };

    const renderFolderPath = (path: string) => {
        if (!path) return <span style={{ color: 'var(--text-muted)' }}>{t.root}</span>;
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/') + (parts.length > 0 ? '/' : '');

        return (
            <span style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                <span style={{ color: 'var(--text-muted)' }}>{parentPath}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-normal)' }}>{fileName}</span>
            </span>
        );
    };

    return (
        <div style={{
            borderRadius: '8px',
            border: '1px solid var(--background-modifier-border)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--background-secondary)' }}>
                    <tr>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '12%' }}>{t.file}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '18%' }}>{t.manualFolder}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '25%' }}>{t.aiTargetFolder}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '15%' }}>{t.tags}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '20%' }}>{t.reasonLabel}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '10%' }}>{t.actions}</th>
                    </tr>
                </thead>
                <tbody style={{ background: 'var(--background-primary)' }}>
                    {files.map(file => {
                        const suggestion = getSuggestion(file.path);
                        const edit = getEditState(file.path);
                        const selectedIndex = edit?.selectedFolderIndex ?? 0;
                        const currentTags = edit?.tags ?? suggestion?.tags ?? [];
                        const isScanning = scanningPaths.includes(file.path);
                        const hasManualFolder = !!edit?.manualFolderPath;
                        const searchValue = manualDropdownSearch[file.path] || '';
                        const isCustom = edit?.useCustomPath || false;

                        return (
                            <tr key={file.path} style={{ borderBottom: '1px solid var(--background-modifier-border)' }}>
                                {/* File Name Column */}
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 500, color: 'var(--text-normal)' }}>{file.name}</div>
                                </td>

                                {/* Manual Folder Column */}
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    <div style={{ position: 'relative' }}>
                                        {/* Selected folder or dropdown trigger */}
                                        <div
                                            onClick={() => toggleManualDropdown(file.path)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: hasManualFolder
                                                    ? '1px solid var(--interactive-accent)'
                                                    : '1px solid var(--background-modifier-border)',
                                                background: 'var(--background-primary)',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <FolderIcon />
                                            <span style={{
                                                flex: 1,
                                                color: hasManualFolder ? 'var(--text-normal)' : 'var(--text-muted)',
                                                fontSize: '0.9em'
                                            }}>
                                                {hasManualFolder ? edit?.manualFolderPath : t.selectFolder}
                                            </span>
                                            {hasManualFolder && (
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); clearManualFolder(file.path); }}
                                                    style={{
                                                        color: 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        padding: '2px'
                                                    }}
                                                >×</span>
                                            )}
                                        </div>

                                        {/* Dropdown */}
                                        {edit?.showManualDropdown && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                marginTop: '4px',
                                                background: 'var(--background-secondary)',
                                                border: '1px solid var(--background-modifier-border)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                                zIndex: 100
                                            }}>
                                                {/* Search input */}
                                                <div style={{ padding: '8px', borderBottom: '1px solid var(--background-modifier-border)' }}>
                                                    <input
                                                        type="text"
                                                        value={searchValue}
                                                        onChange={(e) => setManualDropdownSearch(prev => ({ ...prev, [file.path]: e.target.value }))}
                                                        placeholder={t.searchFolder}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--background-modifier-border)',
                                                            borderRadius: '6px',
                                                            background: 'var(--background-primary)',
                                                            color: 'var(--text-normal)',
                                                            fontSize: '0.9em',
                                                            outline: 'none'
                                                        }}
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                {/* Folder list */}
                                                {allFolders
                                                    .filter(f => !searchValue || f.toLowerCase().includes(searchValue.toLowerCase()))
                                                    .slice(0, 10)
                                                    .map((folder) => (
                                                        <div
                                                            key={folder}
                                                            onClick={() => handleManualFolderSelect(file.path, folder)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-normal)',
                                                                fontSize: '0.9em',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-modifier-hover)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <FolderIcon /> {folder}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* AI Target Folder Column */}
                                <td style={{
                                    padding: '16px',
                                    verticalAlign: 'top',
                                    opacity: hasManualFolder ? 0.4 : 1,
                                    pointerEvents: hasManualFolder ? 'none' : 'auto'
                                }}>
                                    {suggestion?.folderSuggestions ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {suggestion.folderSuggestions.map((fs, idx) => {
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleFolderSelect(file.path, idx)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '6px 10px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            border: isSelected ? '1px solid var(--interactive-accent)' : '1px solid transparent',
                                                            background: isSelected ? 'var(--background-primary)' : 'var(--background-secondary)',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >
                                                        <FolderIcon />
                                                        <span style={{ fontSize: '0.85em' }}>{renderFolderPath(fs.folder)}</span>
                                                        {fs.isNew && (
                                                            <span style={{
                                                                fontSize: '0.7em',
                                                                fontWeight: 600,
                                                                color: 'var(--color-purple, #a855f7)',
                                                                background: 'rgba(168, 85, 247, 0.1)',
                                                                padding: '2px 6px',
                                                                borderRadius: '10px'
                                                            }}>
                                                                <SparklesIcon /> {t.new}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : isScanning ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--interactive-accent)' }}>
                                            <div style={{
                                                width: '14px', height: '14px',
                                                border: '2px solid transparent',
                                                borderTopColor: 'currentColor',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }} />
                                            <span style={{ fontSize: '0.85em' }}>{t.analysing}</span>
                                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-faint)' }}>-</span>
                                    )}
                                </td>

                                {/* Tags Column */}
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    {suggestion ? (
                                        <TagsEditor
                                            tags={currentTags}
                                            onChange={(newTags) => handleTagsChange(file.path, newTags)}
                                            highlightTags={suggestion.newTags}
                                        />
                                    ) : (
                                        <span style={{ color: 'var(--text-faint)' }}>-</span>
                                    )}
                                </td>

                                {/* Reason Column */}
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    {suggestion?.reason ? (
                                        <div style={{
                                            fontSize: '0.85em',
                                            color: 'var(--text-normal)',
                                            lineHeight: '1.5'
                                        }}>
                                            {suggestion.reason}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-faint)' }}>-</span>
                                    )}
                                </td>

                                {/* Actions Column */}
                                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* AI Scan Button - show when no suggestion and no manual folder */}
                                        {onScanRow && !suggestion && !hasManualFolder && (
                                            <button
                                                onClick={() => onScanRow(file.path, file.content)}
                                                disabled={isScanning}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 12px',
                                                    fontSize: '0.85em',
                                                    background: isScanning ? 'var(--background-modifier-border)' : 'transparent',
                                                    color: isScanning ? 'var(--text-muted)' : 'var(--interactive-accent)',
                                                    border: isScanning ? 'none' : '1px solid var(--interactive-accent)',
                                                    borderRadius: '6px',
                                                    cursor: isScanning ? 'wait' : 'pointer',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                {isScanning ? (
                                                    <div style={{
                                                        width: '12px', height: '12px',
                                                        border: '2px solid transparent',
                                                        borderTopColor: 'currentColor',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite'
                                                    }} />
                                                ) : (
                                                    <ScanIcon />
                                                )}
                                                <span>{isScanning ? t.wait : t.aiScan}</span>
                                            </button>
                                        )}

                                        {/* Accept button - show when AI scanned OR manual folder selected */}
                                        {(suggestion || hasManualFolder) && (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(file.path, suggestion)}
                                                    style={{
                                                        background: 'var(--interactive-accent)',
                                                        color: 'var(--text-on-accent)',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85em',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {t.accept}
                                                </button>
                                                <button
                                                    onClick={() => onIgnore(file.path)}
                                                    style={{
                                                        background: 'transparent',
                                                        color: 'var(--text-muted)',
                                                        border: '1px solid var(--background-modifier-border)',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85em'
                                                    }}
                                                >
                                                    {t.ignore}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
