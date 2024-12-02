import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.anthropic = new Anthropic({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });
    }

    async askQuestion(question) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 200,
                messages: [{ role: 'user', content: question }],
            });

            if (response?.content?.[0]?.text) {
                return response.content[0].text;
            }

            throw new Error('Invalid response from Claude API');
        } catch (error) {
            console.error('Error interacting with Claude:', error);
            throw new Error('Failed to interact with Claude API');
        }
    }
}

export default ClaudeService;
