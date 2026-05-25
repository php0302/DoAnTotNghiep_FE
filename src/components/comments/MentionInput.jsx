import React, { useState, useRef, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { projectService } from '../../services/projectService';

/**
 * Textarea thông minh có hỗ trợ @mention với dropdown gợi ý.
 *
 * @param {string}   value      - giá trị textarea (controlled)
 * @param {function} onChange   - (newValue: string) => void
 * @param {function} onSubmit   - () => void (gọi khi nhấn Enter không shift)
 * @param {number}   projectId  - ID project để fetch member gợi ý
 * @param {boolean}  disabled   - tắt input
 */
const MentionInput = ({ value, onChange, onSubmit, projectId, disabled }) => {
  const [mentionState, setMentionState] = useState({
    open: false,
    query: '',
    atPos: -1, // vị trí ký tự @ trong string
  });
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const textareaRef = useRef(null);

  // Fetch gợi ý từ API sau khi query thay đổi (debounce 200ms)
  const [debouncedQuery] = useDebounce(mentionState.query, 200);

  React.useEffect(() => {
    if (!mentionState.open || !projectId) { setSuggestions([]); return; }
    projectService.suggestMembers(projectId, debouncedQuery)
      .then(({ data }) => { setSuggestions(data?.data ?? []); setActiveIdx(0); })
      .catch(() => setSuggestions([]));
  }, [debouncedQuery, mentionState.open, projectId]);

  // ── Xử lý thay đổi nội dung ──────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const text = e.target.value;
    onChange(text);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);

    // Tìm @ gần nhất trước cursor (không có khoảng trắng giữa)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      const atPos = cursor - match[0].length;
      setMentionState({ open: true, query: match[1], atPos });
    } else {
      setMentionState({ open: false, query: '', atPos: -1 });
      setSuggestions([]);
    }
  }, [onChange]);

  // ── Insert username khi chọn gợi ý ───────────────────────────────────────
  const insertMention = useCallback((user) => {
    const atPos = mentionState.atPos;
    const queryLen = mentionState.query.length;

    const before = value.slice(0, atPos);
    const after  = value.slice(atPos + queryLen + 1); // +1 cho ký tự @
    const newText = `${before}@${user.username} ${after}`;

    onChange(newText);
    setMentionState({ open: false, query: '', atPos: -1 });
    setSuggestions([]);

    // Đặt lại cursor sau mention
    requestAnimationFrame(() => {
      const newCursor = before.length + user.username.length + 2; // @ + username + space
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
      textareaRef.current?.focus();
    });
  }, [value, onChange, mentionState]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!mentionState.open || suggestions.length === 0) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestions[activeIdx]) insertMention(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setMentionState({ open: false, query: '', atPos: -1 });
      setSuggestions([]);
    }
  }, [mentionState.open, suggestions, activeIdx, insertMention, onSubmit]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="input-field w-full resize-none text-sm"
        rows={2}
        placeholder="Thêm bình luận... (@ để mention)"
        disabled={disabled}
      />

      {/* ── Dropdown gợi ý ── */}
      {mentionState.open && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 w-60 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <p className="text-[10px] text-warm-muted dark:text-gray-500 px-3 py-1.5 border-b border-black/5 dark:border-white/5 font-semibold uppercase tracking-wide">
            Thành viên dự án
          </p>
          {suggestions.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                i === activeIdx ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-warm-white dark:hover:bg-slate-800'
              }`}
            >
              {/* Avatar chữ cái đầu */}
              <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {(u.fullName || u.username || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {u.fullName || u.username}
                </div>
                <div className="text-[10px] text-warm-muted dark:text-gray-500">@{u.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
