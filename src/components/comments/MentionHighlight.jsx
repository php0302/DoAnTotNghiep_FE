import React from 'react';

/**
 * Render nội dung comment với @mention được highlight màu indigo.
 *
 * @param {string}   content   - nội dung thô của comment
 * @param {Array}    mentions  - list { id, username, fullName } từ API
 */
const MentionHighlight = ({ content, mentions = [] }) => {
  if (!content) return null;

  // Set username (lowercase) đã thực sự được mention & lưu trong DB
  const validUsernames = new Set(
    mentions.map((m) => m.username?.toLowerCase())
  );

  // Split text theo pattern @username
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g);

  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const uname = part.slice(1).toLowerCase();
          const isValid = validUsernames.has(uname);
          return (
            <span
              key={i}
              className={
                isValid
                  ? 'font-semibold text-indigo-600 bg-indigo-50 rounded px-0.5'
                  : 'text-warm-gray'
              }
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
};

export default MentionHighlight;
