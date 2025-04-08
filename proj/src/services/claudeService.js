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

    //question asking
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
    
    Please provide a detailed explanation of this passage:
    "${text}"
    
    Include:
    1. The main meaning or message
    2. Important context or background information
    3. Any significant symbolism or literary devices
    4. How it connects to the broader themes of the work
    5. Any historical or cultural references that might not be obvious to modern readers
    6. Please keep it brief and consise with the message
    7. format this so that there are explicit paragraphs whenever you number something
        ex. 1.(text) then add a paragraph before starting 2.`
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
    
    async getHistoricalContext(contextData) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: `Please provide historical and cultural context about "${contextData.bookTitle}" by ${contextData.author}, published around ${contextData.yearPublished || 'unknown year'}. 
                        
Include information about:
1. The historical period and major events happening during the author's lifetime
2. The cultural, religious, or philosophical movements that influenced the work
3. The author's background and how it shaped their writing
4. The intended audience and reception of the work
5. How the work fits into broader literary or theological traditions

Format this information as a concise but informative overview for a reader who wants to better understand the historical context of the work.`
                    }
                ]
            });
    
            if (response?.content?.[0]?.text) {
                return response.content[0].text;
            }
    
            throw new Error('Invalid response from Claude API');
        } catch (error) {
            console.error('Error in getHistoricalContext:', error);
            throw error;
        }
    }
}

export default ClaudeService;