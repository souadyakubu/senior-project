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
                max_tokens: 1000,
                messages: [{ role: 'user', content: question }],
            });

            if (response?.content?.[0]?.text) {
                return response.content[0].text;
            }

            throw new Error('Invalid response from Claude API');
        } catch (error) {
            console.error('Error in askQuestion:', error);
            throw error;
        }
    }

    async modernizeText(text) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: `Translate the following text into simple, modern English that a contemporary reader would easily understand. 
                        Replace archaic words and complex sentence structures with their modern equivalents. 
                        For example:
                        - Replace "woe" with "sadness" or "trouble"
                        - Replace "thou/thee/thy" with "you/your"
                        - Replace "hath/doth" with "has/does"
                        - Simplify complex or antiquated phrases
                        - Break up long sentences into shorter ones
                        - Use active voice where possible
                        
                        Here's the text to modernize:
                        "${text}"`
                    }
                ]
            });

            if (response?.content?.[0]?.text) {
                return response.content[0].text;
            }

            throw new Error('Invalid response from Claude API');
        } catch (error) {
            console.error('Error in modernizeText:', error);
            throw error;
        }
    }

    async explainText(text, contextData) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: `Given this context - Book: "${contextData.bookTitle}" by ${contextData.author}
                                 Please explain this passage in detail: "${text}"`
                    }
                ]
            });

            if (response?.content?.[0]?.text) {
                return response.content[0].text;
            }

            throw new Error('Invalid response from Claude API');
        } catch (error) {
            console.error('Error in explainText:', error);
            throw error;
        }
    }
}

export default ClaudeService;
