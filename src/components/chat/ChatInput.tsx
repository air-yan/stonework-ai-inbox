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
        <div className="chat-input-area">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder="Type a message..."
            />
            <div className="chat-input-hint">
                Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    );
};
