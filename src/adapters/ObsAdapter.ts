import { App, TFile, normalizePath } from 'obsidian';
import { DataProvider, FileMetadata } from './types';
import { Utils } from '../tools/ObsidianTools';

export class ObsAdapter implements DataProvider {
    constructor(private app: App) { }

    async loadInboxFiles(inboxPath: string): Promise<FileMetadata[]> {
        const folder = this.app.vault.getAbstractFileByPath(normalizePath(inboxPath));

        if (!folder) {
            return [];
        }

        // Check if it's actually a folder, although getAbstractFileByPath returns TAbstractFile
        // We can cast or check instanceof if we imported TFolder, but duck typing is enough or filtering vault.
        // Better strategy: Filter all markdown files in vault that start with inboxPath

        const files = this.app.vault.getMarkdownFiles().filter(file =>
            file.path.startsWith(normalizePath(inboxPath))
        );

        const metadataList: FileMetadata[] = [];

        for (const file of files) {
            const content = await this.app.vault.read(file);
            metadataList.push({
                path: file.path,
                name: file.name,
                content: content
            });
        }

        return metadataList;
    }

    async moveFile(path: string, targetPath: string): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
            const normalizedTarget = normalizePath(targetPath);

            // Check if target file already exists
            const existingFile = this.app.vault.getAbstractFileByPath(normalizedTarget);
            if (existingFile) {
                throw new Error(`DUPLICATE_FILE:${normalizedTarget}`);
            }

            // Ensure target directory exists
            const targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
            if (targetDir && !this.app.vault.getAbstractFileByPath(targetDir)) {
                await this.app.vault.createFolder(targetDir);
            }

            await this.app.fileManager.renameFile(file, normalizedTarget);
        }
    }

    async updateFrontmatter(path: string, data: Record<string, any>): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
            await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                for (const [key, value] of Object.entries(data)) {
                    if (value !== undefined) {
                        if (key === 'tags') {
                            // Handle tag merging
                            const newTags = Array.isArray(value) ? value : [value];
                            const existingTags = frontmatter['tags'];

                            let mergedTags: string[] = [];
                            if (Array.isArray(existingTags)) {
                                mergedTags = [...existingTags];
                            } else if (typeof existingTags === 'string') {
                                mergedTags = [existingTags];
                            }

                            // Add new tags if they don't exist
                            for (const tag of newTags) {
                                if (!mergedTags.includes(tag)) {
                                    mergedTags.push(tag);
                                }
                            }

                            frontmatter['tags'] = mergedTags;
                        } else {
                            // Standard overwrite for other fields
                            frontmatter[key] = value;
                        }
                    }
                }
            });
        }
    }

    getAllTags(): string[] {
        return Utils.getAllTags(this.app);
    }

    getFolderTree(): string {
        return Utils.getFolderTree(this.app);
    }

    getAllFolders(): string[] {
        return Utils.getAllFolders(this.app);
    }

    onInboxChange(inboxPath: string, callback: () => void): () => void {
        const normalizedPath = inboxPath.endsWith('/') ? inboxPath : inboxPath + '/';

        // Helper to check if file is in inbox
        const isInInbox = (path: string) => path.startsWith(normalizedPath) || path === inboxPath;

        // Register event handlers
        const createRef = this.app.vault.on('create', (file) => {
            if (file instanceof TFile && isInInbox(file.path)) {
                callback();
            }
        });

        const deleteRef = this.app.vault.on('delete', (file) => {
            if (file instanceof TFile && isInInbox(file.path)) {
                callback();
            }
        });

        const renameRef = this.app.vault.on('rename', (file, oldPath) => {
            if (file instanceof TFile && (isInInbox(file.path) || isInInbox(oldPath))) {
                callback();
            }
        });

        // Return unsubscribe function
        return () => {
            this.app.vault.offref(createRef);
            this.app.vault.offref(deleteRef);
            this.app.vault.offref(renameRef);
        };
    }

    openFile(path: string): void {
        // 使用 openLinkText 打开文件，效果与双链点击一致
        this.app.workspace.openLinkText(path, '', false);
    }
}
