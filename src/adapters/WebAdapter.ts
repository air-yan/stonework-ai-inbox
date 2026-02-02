import { DataProvider, FileMetadata } from './types';

export class WebAdapter implements DataProvider {
    async loadInboxFiles(inboxPath: string): Promise<FileMetadata[]> {
        // Mock: Loading files from inbox
        return [
            { path: 'Inbox/Note1.md', name: 'Note1.md', content: 'Meeting notes about project Alpha' },
            { path: 'Inbox/Idea.md', name: 'Idea.md', content: 'Buy milk and eggs' }
        ];
    }

    async moveFile(path: string, targetPath: string): Promise<void> {
        // Mock: Moving file
    }

    async updateFrontmatter(path: string, data: Record<string, any>): Promise<void> {
        // Mock: Updating frontmatter
    }

    getAllTags(): string[] {
        return ['#project', '#personal', '#work', '#todo', '#reference', '#archive', '#meeting', '#idea'];
    }

    getFolderTree(): string {
        return `- 1. Projects/
  - Project-Alpha/
  - Project-Beta/
- 2. Areas/
  - Work/
  - Personal/
  - Health/
- 3. Resources/
  - Notes/
  - Templates/
  - References/
- 4. Archive/
  - 2024/
  - 2025/`;
    }

    getAllFolders(): string[] {
        return [
            '1. Projects',
            '1. Projects/Project-Alpha',
            '1. Projects/Project-Beta',
            '2. Areas',
            '2. Areas/Work',
            '2. Areas/Personal',
            '3. Resources',
            '3. Resources/Notes',
            '3. Resources/Templates',
            '4. Archive',
            '4. Archive/2024',
            '4. Archive/2025'
        ];
    }

    onInboxChange(inboxPath: string, callback: () => void): () => void {
        // Web adapter doesn't support real-time file watching
        return () => { };
    }

    openFile(path: string): void {
        // Mock: Would open file in real environment
    }
}
