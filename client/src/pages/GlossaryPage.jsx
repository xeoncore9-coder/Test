import { useState, useEffect } from 'react';
import { getGlossary, addGlossaryEntry, deleteGlossaryEntry } from '../services/api';

export default function GlossaryPage() {
  const [entries, setEntries] = useState([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    const data = await getGlossary();
    setEntries(data);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!source || !target) return;
    await addGlossaryEntry({ source, target, notes });
    setSource('');
    setTarget('');
    setNotes('');
    loadEntries();
  }

  async function handleDelete(id) {
    await deleteGlossaryEntry(id);
    loadEntries();
  }

  return (
    <div className="glossary-page">
      <h1>Glossary</h1>
      <p className="page-desc">
        Define terms for consistent translations. Glossary terms are highlighted in the editor when found in source text.
      </p>

      <form className="glossary-add-form" onSubmit={handleAdd}>
        <input placeholder="Source term" value={source} onChange={(e) => setSource(e.target.value)} />
        <input placeholder="Target term" value={target} onChange={(e) => setTarget(e.target.value)} />
        <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button className="btn primary" type="submit">Add Term</button>
      </form>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No glossary entries yet. Add terms to ensure translation consistency.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Source Term</th>
              <th>Target Term</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.source}</td>
                <td>{entry.target}</td>
                <td>{entry.notes || '-'}</td>
                <td>
                  <button className="btn small danger" onClick={() => handleDelete(entry.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
