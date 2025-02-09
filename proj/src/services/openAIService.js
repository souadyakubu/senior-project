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
        
        // Rate limiting configuration
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimit = {
            maxRequests: 3, // Adjust based on your API tier
            timeWindow: 60000, // 1 minute in milliseconds
            requests: []
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkRateLimit() {
        const now = Date.now();
        this.rateLimit.requests = this.rateLimit.requests.filter(
            time => now - time < this.rateLimit.timeWindow
        );

        if (this.rateLimit.requests.length >= this.rateLimit.maxRequests) {
            const oldestRequest = this.rateLimit.requests[0];
            const waitTime = this.rateLimit.timeWindow - (now - oldestRequest);
            await this.delay(waitTime);
            return this.checkRateLimit();
        }

        this.rateLimit.requests.push(now);
        return true;
    }

    async modernizeText(text, retryCount = 3) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input');
            }

            // Wait for rate limit check
            await this.checkRateLimit();

            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
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
            
            if (error.status === 429 && retryCount > 0) {
                const backoffTime = (4 - retryCount) * 2000; // Exponential backoff
                await this.delay(backoffTime);
                return this.modernizeText(text, retryCount - 1);
            }

            if (error.status === 401) {
                throw new Error('Authentication failed - please check your API key');
            } else if (error.status === 429) {
                throw new Error('Rate limit exceeded - please try again in a few minutes');
            } else if (error.status === 400) {
                throw new Error('Invalid request - please check your input');
            }
            
            throw new Error(`Failed to modernize text: ${error.message}`);
        }
    }
}

export default TextModernizationService;