import { OpenAIService } from '../../src/services/OpenAIService';
import { FileMetadata } from '../../src/adapters/types';

async function testOpenAIService() {
    console.log('Testing OpenAIService (Mock)...');

    const service = new OpenAIService(); // No key, should use mock

    const files: FileMetadata[] = [
        { path: 'test1.md', name: 'test1.md', content: 'project plan content' },
        { path: 'test2.md', name: 'test2.md', content: 'buy milk' }
    ];

    const suggestions = await service.generateSuggestions(files);

    console.log('Suggestions received:', suggestions);

    console.assert(suggestions.length === 2, 'Should return 2 suggestions');
    console.assert(suggestions[0].targetFolder === '2. Areas/Projects', 'Project logic check');
    console.assert(suggestions[1].tags.includes('#personal'), 'Keyword logic check');

    console.log('OpenAIService Test Passed!');
}

testOpenAIService().catch(console.error);
