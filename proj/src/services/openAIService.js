import OpenAI from 'openai';

class TextModernizationService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async modernizeText(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }

            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",  // or "gpt-3.5-turbo" if you prefer
                messages: [{
                    role: "system",
                    content: "You are a helpful assistant that modernizes religious and theological texts while maintaining their core meaning and theological accuracy."
                }, {
                    role: "user",
                    content: `Please modernize the following text while maintaining its meaning and theological accuracy. Make it more accessible to modern readers while preserving the core message: "${text}"`
                }],
                temperature: 0.7,
                max_tokens: 1000
            });

            if (!response || !response.choices || !response.choices[0]?.message?.content) {
                throw new Error('Invalid response from API');
            }

            return response.choices[0].message.content;
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
            } else if (error.status === 400) {
                throw new Error('Invalid request - please check your input');
            }
            
            throw new Error(`Failed to modernize text: ${error.message}`);
        }
    }
}

export default TextModernizationService;