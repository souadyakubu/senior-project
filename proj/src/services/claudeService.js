import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
    constructor(apiKey) {
        this.anthropic = new Anthropic({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true  //MAKE SURE THAT THIS IS GONE WHEN WE RELEASE THE APP. IF THIS IS RELEASED PEOPLE CAN STEAL THE KEY
                                           //FIND SOME WAY TO PUT THIS INTO A BACKEND SERVICE FOR REQUESTS!
        });
    }

    async modernizeText(text) {
        try {
            const response = await this.anthropic.messages.create({
                model: "claude-3-opus-20240229",
                max_tokens: 1024,
                messages: [{
                    role: "user",
                    content: `Please modernize the following text while maintaining its meaning and theological accuracy. Make it more accessible to modern readers while preserving the core message: "${text}"`
                }]
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error modernizing text:', error);
            throw new Error('Failed to modernize text');
        }
    }
}

export default ClaudeService;
