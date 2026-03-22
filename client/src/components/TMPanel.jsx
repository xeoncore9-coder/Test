export default function TMPanel({ matches, onApply }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="panel tm-panel">
        <h3>Translation Memory</h3>
        <p className="panel-empty">No matches found for this segment.</p>
      </div>
    );
  }

  return (
    <div className="panel tm-panel">
      <h3>Translation Memory</h3>
      <div className="tm-matches">
        {matches.map((match, i) => (
          <div key={i} className="tm-match" onClick={() => onApply(match)}>
            <div className="tm-match-header">
              <span className={`match-score ${match.score === 100 ? 'exact' : match.score >= 75 ? 'fuzzy-high' : 'fuzzy-low'}`}>
                {match.score}%
              </span>
              {match.score === 100 && <span className="match-label">Exact match</span>}
              {match.score >= 75 && match.score < 100 && <span className="match-label">Fuzzy match</span>}
            </div>
            <div className="tm-match-source">{match.source}</div>
            <div className="tm-match-target">{match.target}</div>
            <button className="btn small apply-btn" onClick={() => onApply(match)}>
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
