import { AIService } from '../../src/services/AIService';

describe('AIService', () => {
    it('should be instantiable', () => {
        const service = new AIService({ apiKey: 'test', baseURL: 'test', modelName: 'test' });
        expect(service).toBeTruthy();
    });
});
