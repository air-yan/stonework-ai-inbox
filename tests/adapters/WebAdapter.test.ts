import { WebAdapter } from '../../src/adapters/WebAdapter';

async function testWebAdapter() {
    const adapter = new WebAdapter();

    console.log('Testing loadInboxFiles...');
    const files = await adapter.loadInboxFiles('Inbox');
    console.assert(files.length > 0, 'Should return mock files');
    console.log('Files loaded:', files);

    console.log('Testing moveFile...');
    await adapter.moveFile('Inbox/Note1.md', 'Archive/Note1.md');

    console.log('Testing updateFrontmatter...');
    await adapter.updateFrontmatter('Inbox/Note1.md', { tag: 'test' });

    console.log('WebAdapter Test Passed!');
}

testWebAdapter().catch(console.error);
