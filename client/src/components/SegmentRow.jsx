import { useState, useRef, useEffect } from 'react';

const STATUS_ICONS = {
  draft: '○',
  translated: '◐',
  confirmed: '●',
};

export default function SegmentRow({ segment, index, isActive, glossaryTerms, onFocus, onUpdate, onConfirm }) {
  const [target, setTarget] = useState(segment.target);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setTarget(segment.target);
  }, [segment.target]);

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  function handleTargetChange(e) {
    const value = e.target.value;
    setTarget(value);

    // Debounce save
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({
        target: value,
        status: value ? 'translated' : 'draft',
      });
    }, 500);
  }

  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      onUpdate({ target, status: target ? 'translated' : 'draft' });
      onConfirm();
    }
  }

  function highlightGlossaryTerms(text) {
    if (!glossaryTerms || glossaryTerms.length === 0) return text;

    let result = text;
    for (const term of glossaryTerms) {
      const regex = new RegExp(`(${escapeRegex(term.source)})`, 'gi');
      result = result.replace(regex, `<mark title="${term.target}">$1</mark>`);
    }
    return result;
  }

  return (
    <div
      className={`segment-row ${isActive ? 'active' : ''} status-${segment.status} ${segment.locked ? 'locked' : ''}`}
      onClick={onFocus}
    >
      <span className="col-num">{index}</span>
      <div className="col-source">
        <div
          className="source-text"
          dangerouslySetInnerHTML={{ __html: highlightGlossaryTerms(escapeHtml(segment.source)) }}
        />
      </div>
      <div className="col-target">
        {segment.locked ? (
          <div className="target-text locked">{segment.target}</div>
        ) : (
          <textarea
            ref={textareaRef}
            className="target-input"
            value={target}
            onChange={handleTargetChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder="Enter translation..."
            rows={Math.max(1, Math.ceil(segment.source.length / 60))}
          />
        )}
      </div>
      <span className={`col-status status-badge ${segment.status}`}>
        {STATUS_ICONS[segment.status]} {segment.status}
      </span>
      <div className="col-actions">
        <button
          className="btn small confirm-btn"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          disabled={!target || segment.status === 'confirmed'}
          title="Confirm (Ctrl+Enter)"
        >
          ✓
        </button>
        <button
          className="btn small"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ locked: !segment.locked });
          }}
          title={segment.locked ? 'Unlock' : 'Lock'}
        >
          {segment.locked ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
