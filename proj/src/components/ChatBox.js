import React, { useState, useEffect, useRef } from 'react';

const ChatBox = ({ onSendMessage, messages, bookContext }) => {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const loadingMessageRef = useRef(null);

    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    const handleSendMessage = async () => {
        if (inputText.trim()) {
            try {
                setIsLoading(true);
                await onSendMessage(inputText);
                setInputText('');
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const scrollToBottom = () => {
        if (isLoading && loadingMessageRef.current) {
            loadingMessageRef.current.scrollIntoView({ behavior: "smooth" });
        } else if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const styles = {
        chatboxContainer: {
            width: '100%',
            height: '400px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            marginTop: '20px',
        },
        chatHeader: {
            backgroundColor: '#4a90e2',
            color: 'white',
            padding: '10px 15px',
            fontWeight: 'bold',
        },
        chatMessages: {
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
        },
        message: {
            maxWidth: '80%',
            padding: '10px 15px',
            marginBottom: '10px',
            borderRadius: '18px',
            lineHeight: 1.4,
        },
        userMessage: {
            alignSelf: 'flex-end',
            backgroundColor: '#e6f2ff',
            color: '#333',
            textAlign: 'right',
            borderTopRightRadius: '0',
        },
        botMessage: {
            alignSelf: 'flex-start',
            backgroundColor: '#f0f0f0',
            color: '#333',
            textAlign: 'left',
            borderTopLeftRadius: '0',
        },
        separator: {
            width: '100%',
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '10px 0',
        },
        chatInput: {
            display: 'flex',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderTop: '1px solid #e0e0e0',
        },
        textarea: {
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
        },
        button: {
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 15px',
            marginLeft: '10px',
            cursor: 'pointer',
        },
        disabledButton: {
            backgroundColor: '#cccccc',
            cursor: 'not-allowed',
        },
        loadingMessage: {
            alignSelf: 'center',
            fontStyle: 'italic',
            color: '#888',
            margin: '10px 0',
        },
        noMessages: {
            textAlign: 'center',
            color: '#888',
            margin: '20px 0',
        }
    };

    return (
        <div style={styles.chatboxContainer}>
            {bookContext && (
                <div style={styles.chatHeader}>
                    <h3>{bookContext.title} by {bookContext.author}</h3>
                    <p>Section: {bookContext.currentSection}</p>
                </div>
            )}
            <div style={styles.chatMessages}>
                {messages && messages.length > 0 ? (
                    messages.map((msg, index) => (
                        <React.Fragment key={index}>
                            <div style={{ ...styles.message, ...styles.userMessage }}>
                                <p><strong>You:</strong> {msg.text}</p>
                            </div>
                            {msg.response && (
                                <div style={{ ...styles.message, ...styles.botMessage }}>
                                    <p><strong>AI:</strong> {msg.response}</p>
                                </div>
                            )}
                            {index < messages.length - 1 && <div style={styles.separator} />}
                        </React.Fragment>
                    ))
                ) : (
                    <div style={styles.noMessages}>
                        <p>Ask me questions about this book!</p>
                    </div>
                )}
                {isLoading && (
                    <div style={styles.loadingMessage} ref={loadingMessageRef}>
                        <p>AI is thinking...</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.chatInput}>
                <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about this book..."
                    rows={2}
                    style={styles.textarea}
                />
                <button
                    onClick={handleSendMessage}
                    style={{
                        ...styles.button,
                        ...(isLoading || !inputText.trim() ? styles.disabledButton : {})
                    }}
                    disabled={isLoading || !inputText.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatBox;