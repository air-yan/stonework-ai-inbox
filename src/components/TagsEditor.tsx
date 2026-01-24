import React, { useState, KeyboardEvent } from 'react';

interface TagsEditorProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    highlightTags?: string[]; // Tags to visually highlight (e.g. new ones)
}

export const TagsEditor: React.FC<TagsEditorProps> = ({ tags, onChange, highlightTags = [] }) => {
    const [inputValue, setInputValue] = useState('');

    const handleRemoveTag = (indexToRemove: number) => {
        onChange(tags.filter((_, index) => index !== indexToRemove));
    };

    const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const rawVal = inputValue.trim();
            const newTag = rawVal.startsWith('#') ? rawVal : `#${rawVal}`;

            if (!tags.includes(newTag)) {
                onChange([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {tags.map((tag, index) => {
                const isHighlight = highlightTags.includes(tag);
                return (
                    <span
                        key={index}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: isHighlight
                                ? 'var(--color-green-soft, rgba(34, 197, 94, 0.15))'
                                : 'var(--interactive-accent)',
                            color: isHighlight
                                ? 'var(--color-green, #22c55e)'
                                : 'var(--text-on-accent)',
                            border: isHighlight
                                ? '1px solid var(--color-green, #22c55e)'
                                : '1px solid transparent',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            gap: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tag}
                        <button
                            onClick={() => handleRemoveTag(index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                boxShadow: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                padding: '0 2px',
                                marginLeft: '2px',
                                fontSize: '1.1em',
                                lineHeight: 1,
                                opacity: 0.7
                            }}
                            title="Remove tag"
                        >
                            ×
                        </button>
                    </span>
                );
            })}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ Add tag"
                style={{
                    background: 'transparent',
                    border: '1px dashed var(--text-muted)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.85em',
                    color: 'var(--text-normal)',
                    width: '80px',
                    outline: 'none'
                }}
            />
        </div>
    );
};
