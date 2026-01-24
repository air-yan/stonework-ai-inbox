import { App, TAbstractFile, TFile, TFolder } from 'obsidian';

export class Utils {
    /**
     * Generates a Markdown representation of the vault's file structure.
     * @param app Obsidian App instance
     * @returns Markdown tree string
     */
    static getFolderTree(app: App): string {
        const root = app.vault.getRoot();
        return this.traverseFolderOnly(root, 0);
    }

    private static traverseFolderOnly(folder: TFolder, depth: number): string {
        let output = '';
        const indent = '  '.repeat(depth);

        // Sort children: Folders only. Alphabetical.
        const children = [...folder.children]
            .filter(child => child instanceof TFolder)
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const child of children) {
            // Formatting: - FolderName/
            output += `${indent}- ${child.name}/\n`;
            // @ts-ignore - child is guaranteed to be TFolder by filter
            output += this.traverseFolderOnly(child as TFolder, depth + 1);
        }
        return output;
    }

    /**
     * Retrieves all unique tags from the metadata cache.
     * @param app Obsidian App instance
     * @returns Array of unique tag strings
     */
    static getAllTags(app: App): string[] {
        // Safe access to metadataCache
        if (!app.metadataCache) return [];

        const tagsCache = app.metadataCache.getTags();
        if (!tagsCache) return [];

        // getTags returns Record<string, number> where key is the tag
        return Object.keys(tagsCache).sort();
    }

    /**
     * Retrieves all folder paths in the vault.
     * @param app Obsidian App instance
     * @returns Array of folder paths
     */
    static getAllFolders(app: App): string[] {
        const folders: string[] = [];
        const root = app.vault.getRoot();

        const traverse = (folder: TFolder) => {
            if (folder.path !== '/') {
                folders.push(folder.path);
            }

            for (const child of folder.children) {
                if (child instanceof TFolder) {
                    traverse(child);
                }
            }
        };

        traverse(root);
        return folders.sort();
    }
}
