export interface FileMetadata {
    path: string;
    name: string;
    content: string;
}

export interface FolderSuggestion {
    folder: string;
    reason: string;
    isNew?: boolean; // 是否是新文件夹
}

export interface OrganizationSuggestion {
    path: string;
    folderSuggestions: FolderSuggestion[]; // Array of 3 folder suggestions
    selectedFolderIndex: number; // Default: 0 (first suggestion selected)
    tags: string[];
    newTags?: string[]; // List of tags that are newly created
    area?: string;
    // Legacy field for compatibility
    targetFolder?: string;
    reason?: string;
}

export interface DataProvider {
    loadInboxFiles(inboxPath: string): Promise<FileMetadata[]>;
    moveFile(path: string, targetPath: string): Promise<void>;
    updateFrontmatter(path: string, data: Record<string, any>): Promise<void>;
    // 用于 PARA AI 分析
    getAllTags(): string[];
    getFolderTree(): string;
    getAllFolders(): string[];
    // 文件监听
    onInboxChange(inboxPath: string, callback: () => void): () => void;
    // 打开文件（类似双链点击效果）
    openFile(path: string): void;
}

