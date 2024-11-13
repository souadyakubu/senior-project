// src/services/claudeService.js
import config from './config';
import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: config.claude.apiKey
        });
        this.messageHistory = [];
    }

    async askQuestion(selectedText, question) {
        try {
            // Add user message to history
            this.messageHistory.push({
                role: "user",
                content: `Context from book: ${selectedText}\n\nQuestion: ${question}`
            });

            const response = await this.anthropic.messages.create({
                model: config.claude.model,
                max_tokens: 1024,
                messages: this.messageHistory
            });

            // Add Claude's response to history
            this.messageHistory.push({
                role: "assistant",
                content: response.content[0].text
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error in Claude service:', error);
            throw error;
        }
    }

    clearHistory() {
        this.messageHistory = [];
    }
}

const claudeService = new ClaudeService();
export default claudeService;