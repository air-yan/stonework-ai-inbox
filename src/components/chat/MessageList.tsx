import React, { useEffect, useRef } from 'react';
import { CoreMessage } from '../../services/AIService';

export const MessageList: React.FC<{ messages: CoreMessage[] }> = ({ messages }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-message-list">
            {messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.role}`}>
                    <strong className="role-label">
                        {m.role === 'user' ? 'You' : 'AI'}
                    </strong>
                    <div className="inbox-ai-content">{m.content as string}</div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};
