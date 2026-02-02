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
    onOpenFile?: (path: string) => void;
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

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14m-7-7h14" />
    </svg>
);

const TEXT = {
    en: {
        file: 'File',
        manualFolder: 'Manual folder',
        aiTargetFolder: 'AI target folder',
        tags: 'Tags',
        actions: 'Actions',
        aiScan: 'AI scan',
        wait: 'Wait',
        accept: 'Accept',
        ignore: 'Ignore',
        selectFolder: 'Select folder...',
        searchFolder: 'Search folders...',
        analysing: 'Analysing content structure...',
        new: 'New',
        root: 'Root',
        reasonLabel: 'AI reason',
        noSelection: 'Not selected',
        createFolder: 'Create'
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
        noSelection: '未选择',
        createFolder: '创建'
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
    allFolders = [],
    onOpenFile
}) => {
    const [editState, setEditState] = useState<Record<string, EditableRow>>({});
    const [manualDropdownSearch, setManualDropdownSearch] = useState<Record<string, string>>({});
    const [highlightIndex, setHighlightIndex] = useState<Record<string, number>>({}); // Keyboard navigation index
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

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setEditState(prev => {
                const hasOpenDropdown = Object.values(prev).some(e => e.showManualDropdown);
                if (!hasOpenDropdown) return prev;
                const updated = { ...prev };
                Object.keys(updated).forEach(key => {
                    if (updated[key].showManualDropdown) {
                        updated[key] = { ...updated[key], showManualDropdown: false };
                    }
                });
                return updated;
            });
            setManualDropdownSearch({});
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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
        // Reset highlight index when opening
        setHighlightIndex(prev => ({ ...prev, [path]: -1 }));
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

        // Priority: manual folder > AI suggestion
        const targetFolder = edit.manualFolderPath
            ? edit.manualFolderPath
            : suggestion?.folderSuggestions?.[edit.selectedFolderIndex]?.folder || '';

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
        if (!path) return <span className="inbox-ai-text-muted">{t.root}</span>;
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/') + (parts.length > 0 ? '/' : '');

        return (
            <span className="folder-path">
                <span className="parent">{parentPath}</span>
                <span className="name">{fileName}</span>
            </span>
        );
    };

    return (
        <div className="org-table-container">
            <table className="org-table">
                <thead>
                    <tr>
                        <th style={{ width: '12%' }}>{t.file}</th>
                        <th style={{ width: '18%' }}>{t.manualFolder}</th>
                        <th style={{ width: '25%' }}>{t.aiTargetFolder}</th>
                        <th style={{ width: '15%' }}>{t.tags}</th>
                        <th style={{ width: '20%' }}>{t.reasonLabel}</th>
                        <th style={{ width: '10%' }}>{t.actions}</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map(file => {
                        const suggestion = getSuggestion(file.path);
                        const edit = getEditState(file.path);
                        const selectedIndex = edit?.selectedFolderIndex ?? 0;
                        const currentTags = edit?.tags ?? suggestion?.tags ?? [];
                        const isScanning = scanningPaths.includes(file.path);
                        const hasManualFolder = !!edit?.manualFolderPath;
                        const searchValue = manualDropdownSearch[file.path] || '';

                        return (
                            <tr key={file.path}>
                                {/* File Name Column */}
                                <td>
                                    <div
                                        onClick={() => onOpenFile?.(file.path)}
                                        className={`org-table-filename ${onOpenFile ? '' : 'no-link'}`}
                                        title={file.path}
                                    >
                                        {file.name}
                                    </div>
                                </td>

                                {/* Manual Folder Column */}
                                <td>
                                    <div className="manual-folder-selector">
                                        {/* Selected folder or dropdown trigger */}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleManualDropdown(file.path); }}
                                            className={`manual-folder-trigger ${hasManualFolder ? 'selected' : ''}`}
                                        >
                                            <FolderIcon />
                                            <span className={hasManualFolder ? '' : 'placeholder'}>
                                                {hasManualFolder ? edit?.manualFolderPath : t.selectFolder}
                                            </span>
                                            {hasManualFolder && (
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); clearManualFolder(file.path); }}
                                                    className="clear-btn"
                                                >x</span>
                                            )}
                                        </div>

                                        {/* Dropdown */}
                                        {edit?.showManualDropdown && (() => {
                                            const filteredFolders = allFolders
                                                .filter(f => !searchValue || f.toLowerCase().includes(searchValue.toLowerCase()))
                                                .slice(0, 15);
                                            const hasCreateOption = searchValue && !allFolders.some(f => f.toLowerCase() === searchValue.toLowerCase());
                                            const totalItems = (hasCreateOption ? 1 : 0) + filteredFolders.length;
                                            const currentHighlight = highlightIndex[file.path] ?? -1;

                                            const handleKeyDown = (e: React.KeyboardEvent) => {
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setHighlightIndex(prev => ({
                                                        ...prev,
                                                        [file.path]: Math.min((prev[file.path] ?? -1) + 1, totalItems - 1)
                                                    }));
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setHighlightIndex(prev => ({
                                                        ...prev,
                                                        [file.path]: Math.max((prev[file.path] ?? 0) - 1, 0)
                                                    }));
                                                } else if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    if (currentHighlight >= 0) {
                                                        const selectedFolder = hasCreateOption
                                                            ? (currentHighlight === 0 ? searchValue : filteredFolders[currentHighlight - 1])
                                                            : filteredFolders[currentHighlight];
                                                        if (selectedFolder) {
                                                            setManualDropdownSearch(prev => ({ ...prev, [file.path]: selectedFolder }));
                                                        }
                                                    } else if (filteredFolders.length > 0) {
                                                        setManualDropdownSearch(prev => ({ ...prev, [file.path]: filteredFolders[0] }));
                                                        setHighlightIndex(prev => ({ ...prev, [file.path]: hasCreateOption ? 1 : 0 }));
                                                    }
                                                } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (currentHighlight >= 0) {
                                                        const selectedFolder = hasCreateOption
                                                            ? (currentHighlight === 0 ? searchValue : filteredFolders[currentHighlight - 1])
                                                            : filteredFolders[currentHighlight];
                                                        if (selectedFolder) {
                                                            handleManualFolderSelect(file.path, selectedFolder);
                                                        }
                                                    } else if (hasCreateOption) {
                                                        handleManualFolderSelect(file.path, searchValue);
                                                    } else if (filteredFolders.length > 0) {
                                                        handleManualFolderSelect(file.path, filteredFolders[0]);
                                                    }
                                                } else if (e.key === 'Escape') {
                                                    toggleManualDropdown(file.path);
                                                }
                                            };

                                            return (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="folder-dropdown"
                                                >
                                                    {/* Search input */}
                                                    <div className="folder-dropdown-search">
                                                        <input
                                                            type="text"
                                                            value={searchValue}
                                                            onChange={(e) => {
                                                                setManualDropdownSearch(prev => ({ ...prev, [file.path]: e.target.value }));
                                                                setHighlightIndex(prev => ({ ...prev, [file.path]: -1 }));
                                                            }}
                                                            onKeyDown={handleKeyDown}
                                                            placeholder={t.searchFolder}
                                                            autoFocus
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    {/* Create new folder option */}
                                                    {hasCreateOption && (
                                                        <div
                                                            onClick={() => handleManualFolderSelect(file.path, searchValue)}
                                                            className={`folder-dropdown-create ${currentHighlight === 0 ? 'highlighted' : ''}`}
                                                            onMouseEnter={() => setHighlightIndex(prev => ({ ...prev, [file.path]: 0 }))}
                                                        >
                                                            <PlusIcon /> {t.createFolder} "{searchValue}"
                                                        </div>
                                                    )}
                                                    {/* Folder list */}
                                                    {filteredFolders.map((folder, idx) => {
                                                        const itemIndex = hasCreateOption ? idx + 1 : idx;
                                                        const isHighlighted = currentHighlight === itemIndex;
                                                        return (
                                                            <div
                                                                key={folder}
                                                                onClick={() => handleManualFolderSelect(file.path, folder)}
                                                                className={`folder-dropdown-item ${isHighlighted ? 'highlighted' : ''}`}
                                                                onMouseEnter={() => setHighlightIndex(prev => ({ ...prev, [file.path]: itemIndex }))}
                                                            >
                                                                <FolderIcon /> {folder}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </td>

                                {/* AI Target Folder Column */}
                                <td className={hasManualFolder ? 'inbox-ai-muted' : ''}>
                                    {suggestion?.folderSuggestions ? (
                                        <div className="ai-folder-suggestions">
                                            {suggestion.folderSuggestions.map((fs, idx) => {
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleFolderSelect(file.path, idx)}
                                                        className={`ai-folder-option ${isSelected ? 'selected' : ''}`}
                                                    >
                                                        <FolderIcon />
                                                        <span className="inbox-ai-text-sm">{renderFolderPath(fs.folder)}</span>
                                                        {fs.isNew && (
                                                            <span className="new-badge">
                                                                <SparklesIcon /> {t.new}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : isScanning ? (
                                        <div className="scanning-indicator">
                                            <div className="spinner" />
                                            <span>{t.analysing}</span>
                                        </div>
                                    ) : (
                                        <span className="inbox-ai-text-faint">-</span>
                                    )}
                                </td>

                                {/* Tags Column */}
                                <td>
                                    {suggestion ? (
                                        <TagsEditor
                                            tags={currentTags}
                                            onChange={(newTags) => handleTagsChange(file.path, newTags)}
                                            highlightTags={suggestion.newTags}
                                        />
                                    ) : (
                                        <span className="inbox-ai-text-faint">-</span>
                                    )}
                                </td>

                                {/* Reason Column */}
                                <td>
                                    {suggestion?.reason ? (
                                        <div className="ai-reason">{suggestion.reason}</div>
                                    ) : (
                                        <span className="inbox-ai-text-faint">-</span>
                                    )}
                                </td>

                                {/* Actions Column */}
                                <td>
                                    <div className="actions-column">
                                        {/* AI Scan Button - show when no suggestion and no manual folder */}
                                        {onScanRow && !suggestion && !hasManualFolder && (
                                            <button
                                                onClick={() => onScanRow(file.path, file.content)}
                                                disabled={isScanning}
                                                className="btn-outline-accent"
                                            >
                                                {isScanning ? (
                                                    <div className="spinner" />
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
                                                    className="btn-accept"
                                                >
                                                    {t.accept}
                                                </button>
                                                <button
                                                    onClick={() => onIgnore(file.path)}
                                                    className="btn-secondary"
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
