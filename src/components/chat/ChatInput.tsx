import React, { useState } from 'react';

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim() && !disabled) {
                onSend(text);
                setText('');
            }
        }
    };

    return (
        <div className="chat-input-area" style={{ padding: '10px', borderTop: '1px solid var(--background-modifier-border)' }}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder="Type a message..."
                style={{
                    width: '100%',
                    minHeight: '50px',
                    background: 'var(--background-primary)',
                    color: 'var(--text-normal)',
                    border: '1px solid var(--background-modifier-border)',
                    borderRadius: '4px',
                    padding: '8px',
                    resize: 'vertical'
                }}
            />
            <div style={{ fontSize: '0.8em', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    );
};
