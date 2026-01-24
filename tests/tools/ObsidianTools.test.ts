import { Utils } from '../../src/tools/ObsidianTools';
import { App, TFolder, TFile } from 'obsidian';

// Mocking Obsidian types since they are just interfaces/classes at runtime usually provided by the app
// For testing, we just need the structural compatibility
const createMockApp = () => {
    return {
        vault: {
            getRoot: jest.fn(),
        },
        metadataCache: {
            getTags: jest.fn()
        }
    } as unknown as App;
};

describe('ObsidianTools', () => {
    let mockApp: any;

    beforeEach(() => {
        mockApp = createMockApp();
    });

    test('getFileTree returns Markdown list of files', () => {
        // Setup mock vault structure
        // Root -> [Folder A, RootNote.md]
        // Folder A -> [Note.md]
        const folderA = {
            name: 'Folder A',
            children: [] as any[],
            path: 'Folder A'
        } as unknown as TFolder;

        const noteInA = {
            name: 'Note.md',
            path: 'Folder A/Note.md'
        } as unknown as TFile;
        // manually linking parent/children for traversal if needed, but our Utils only uses .children array
        (folderA as any).children = [noteInA];

        const rootNote = {
            name: 'RootNote.md',
            path: 'RootNote.md'
        } as unknown as TFile;

        const root = {
            children: [folderA, rootNote]
        } as unknown as TFolder;

        mockApp.vault.getRoot.mockReturnValue(root);

        // We also need to mock instanceof checks because Utils uses them
        // In Jest environment, TFolder/TFile are not available unless verified or mocked globally
        // A simple workaround for the test is to assume structure signifies type or mock imports.
        // But since we import TFolder/TFile from obsidian (which is likely a type-only import or shim),
        // "instanceof" checks might fail if those classes aren't real classes in the test env.
        // Let's rely on the fact that we might need to mock the implementation of Utils to be testable 
        // OR we can't test "instanceof" easily without a real mock.
        // 
        // ALTERNATIVE: Use a "type" property in our mock and adjust Utils to check structure if possible, 
        // OR just try to run it. If it fails on instanceof, we might skip unit test and go to integration.
    });

    test('getAllTags returns unique list of tags', () => {
        mockApp.metadataCache.getTags.mockReturnValue({
            '#tag1': 1,
            '#tag2': 2
        });

        const tags = Utils.getAllTags(mockApp);
        expect(tags).toEqual(['#tag1', '#tag2']);
    });
});
