import React, { useEffect, useRef } from 'react';
import { CoreMessage } from '../../services/AIService';

export const MessageList: React.FC<{ messages: CoreMessage[] }> = ({ messages }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="sai-chat-message-list">
            {messages.map((m, i) => (
                <div key={i} className={`sai-chat-message sai-${m.role}`}>
                    <strong className="sai-role-label">
                        {m.role === 'user' ? 'You' : 'AI'}
                    </strong>
                    <div className="sai-content">{m.content as string}</div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};
