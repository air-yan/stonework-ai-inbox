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
        <div className="sai-tags-editor">
            {tags.map((tag, index) => {
                const isHighlight = highlightTags.includes(tag);
                return (
                    <span
                        key={index}
                        className={`sai-tag ${isHighlight ? 'sai-highlight' : ''}`}
                    >
                        {isHighlight && <span className="sai-new-indicator">*</span>}
                        {tag}
                        {isHighlight && <span className="sai-new-label">NEW</span>}
                        <button
                            onClick={() => handleRemoveTag(index)}
                            className="sai-remove-btn"
                            title="Remove tag"
                        >
                            x
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
                className="sai-tag-input"
            />
        </div>
    );
};
