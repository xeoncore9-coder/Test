export default function GlossaryPanel({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="panel glossary-panel">
        <h3>Glossary</h3>
        <p className="panel-empty">No glossary terms found in this segment.</p>
      </div>
    );
  }

  return (
    <div className="panel glossary-panel">
      <h3>Glossary</h3>
      <div className="glossary-matches">
        {matches.map((entry, i) => (
          <div key={i} className="glossary-entry">
            <div className="glossary-pair">
              <span className="glossary-source">{entry.source}</span>
              <span className="glossary-arrow">→</span>
              <span className="glossary-target">{entry.target}</span>
            </div>
            {entry.notes && <div className="glossary-notes">{entry.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
