import { useState, useEffect } from 'react';
import { getTM, addTMEntry, deleteTMEntry } from '../services/api';

export default function TMPage() {
  const [entries, setEntries] = useState([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('fr');

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    const data = await getTM();
    setEntries(data);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!source || !target) return;
    await addTMEntry({ source, target, sourceLang, targetLang });
    setSource('');
    setTarget('');
    loadEntries();
  }

  async function handleDelete(index) {
    await deleteTMEntry(index);
    loadEntries();
  }

  return (
    <div className="tm-page">
      <h1>Translation Memory</h1>
      <p className="page-desc">
        Translation Memory stores previously translated segments. Matches are shown automatically when editing.
      </p>

      <form className="tm-add-form" onSubmit={handleAdd}>
        <input placeholder="Source text" value={source} onChange={(e) => setSource(e.target.value)} />
        <input placeholder="Target text" value={target} onChange={(e) => setTarget(e.target.value)} />
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
          <option value="en">EN</option><option value="fr">FR</option><option value="de">DE</option>
          <option value="es">ES</option><option value="ja">JA</option><option value="zh">ZH</option>
        </select>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
          <option value="en">EN</option><option value="fr">FR</option><option value="de">DE</option>
          <option value="es">ES</option><option value="ja">JA</option><option value="zh">ZH</option>
        </select>
        <button className="btn primary" type="submit">Add Entry</button>
      </form>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No TM entries yet. Confirmed translations are automatically added to the TM.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Target</th>
              <th>Languages</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td>{entry.source}</td>
                <td>{entry.target}</td>
                <td>{entry.sourceLang?.toUpperCase()} → {entry.targetLang?.toUpperCase()}</td>
                <td>{entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="btn small danger" onClick={() => handleDelete(i)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
