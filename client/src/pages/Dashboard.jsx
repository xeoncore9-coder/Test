import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, uploadFile, deleteProject } from '../services/api';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'cs', name: 'Czech' },
  { code: 'tr', name: 'Turkish' },
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('fr');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const project = await uploadFile(file, projectName, sourceLang, targetLang);
      navigate(`/editor/${project.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return;
    await deleteProject(id);
    loadProjects();
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      if (!projectName) setProjectName(dropped.name.replace(/\.[^.]+$/, ''));
      setShowUpload(true);
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Projects</h1>
        <button className="btn primary" onClick={() => setShowUpload(!showUpload)}>
          + New Project
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showUpload && (
        <form className="upload-form" onSubmit={handleUpload}>
          <div
            className={`drop-zone ${file ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input').click()}
          >
            {file ? (
              <span>{file.name}</span>
            ) : (
              <span>Drop a file here or click to browse<br /><small>.txt, .docx, .xliff</small></span>
            )}
            <input
              id="file-input"
              type="file"
              accept=".txt,.docx,.xliff,.xlf"
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                if (f && !projectName) setProjectName(f.name.replace(/\.[^.]+$/, ''));
              }}
              hidden
            />
          </div>

          <div className="form-row">
            <label>
              Project Name
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Translation Project"
              />
            </label>
          </div>

          <div className="form-row lang-row">
            <label>
              Source Language
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </label>
            <span className="arrow">→</span>
            <label>
              Target Language
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </label>
          </div>

          <button className="btn primary" type="submit" disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Create Project'}
          </button>
        </form>
      )}

      {projects.length === 0 && !showUpload ? (
        <div className="empty-state">
          <p>No projects yet. Upload a file to get started.</p>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((p) => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/editor/${p.id}`)}>
              <div className="project-info">
                <h3>{p.name}</h3>
                <span className="meta">
                  {p.fileName} &middot; {p.sourceLang.toUpperCase()} → {p.targetLang.toUpperCase()} &middot; {p.segmentCount} segments
                </span>
              </div>
              <div className="project-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <span>{p.progress}%</span>
              </div>
              <button
                className="btn danger small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p.id);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
