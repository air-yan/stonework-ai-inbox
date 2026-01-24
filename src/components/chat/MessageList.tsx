import React, { useEffect, useRef } from 'react';
import { CoreMessage } from '../../services/AIService';

export const MessageList: React.FC<{ messages: CoreMessage[] }> = ({ messages }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-message-list" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {messages.map((m, i) => (
                <div key={i} className={`chat-message ${m.role}`} style={{
                    marginBottom: '10px',
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    background: m.role === 'user' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                    color: 'var(--text-normal)',
                    padding: '8px',
                    borderRadius: '8px',
                    maxWidth: '85%',
                    wordWrap: 'break-word',
                    marginLeft: m.role === 'user' ? 'auto' : '0',
                    marginRight: m.role === 'user' ? '0' : 'auto'
                }}>
                    <strong style={{ display: 'block', fontSize: '0.8em', opacity: 0.7, marginBottom: '4px' }}>
                        {m.role === 'user' ? 'You' : 'AI'}
                    </strong>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content as string}</div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};
