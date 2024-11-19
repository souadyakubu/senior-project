import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.anthropic = new Anthropic({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async modernizeText(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }

            const response = await this.anthropic.messages.create({
                model: "claude-3-sonnet-20240229",  // Updated to Claude 3.5 Sonnet
                max_tokens: 1024,
                messages: [{
                    role: "user",
                    content: `Please modernize the following text while maintaining its meaning and theological accuracy. Make it more accessible to modern readers while preserving the core message: "${text}"`
                }]
            });

            if (!response || !response.content || !response.content[0]) {
                throw new Error('Invalid response from API');
            }

            return response.content[0].text;
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                type: error.type
            });
            
            if (error.status === 401) {
                throw new Error('Authentication failed - please check your API key');
            } else if (error.status === 429) {
                throw new Error('Rate limit exceeded - please try again later');
            } else if (error.type === 'invalid_request_error') {
                throw new Error('Invalid request - please check your input');
            }
            
            throw new Error(`Failed to modernize text: ${error.message}`);
        }
    }
}

export default ClaudeService;
