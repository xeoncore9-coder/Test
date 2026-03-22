import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, updateSegment, confirmSegment, exportProject, searchTM, checkGlossary } from '../services/api';
import SegmentRow from '../components/SegmentRow';
import TMPanel from '../components/TMPanel';
import GlossaryPanel from '../components/GlossaryPanel';

export default function EditorPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const [tmMatches, setTmMatches] = useState([]);
  const [glossaryMatches, setGlossaryMatches] = useState([]);
  const [filter, setFilter] = useState('all'); // all | draft | translated | confirmed
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const data = await getProject(projectId);
      setProject(data);
      if (data.segments.length > 0 && !activeSegmentId) {
        setActiveSegmentId(data.segments[0].id);
        loadSidebarData(data.segments[0].source);
      }
    } catch (e) {
      navigate('/');
    }
  }

  async function loadSidebarData(sourceText) {
    const [tm, glossary] = await Promise.all([
      searchTM(sourceText).catch(() => []),
      checkGlossary(sourceText).catch(() => []),
    ]);
    setTmMatches(tm);
    setGlossaryMatches(glossary);
  }

  function handleSegmentFocus(segment) {
    setActiveSegmentId(segment.id);
    loadSidebarData(segment.source);
  }

  const handleSegmentUpdate = useCallback(async (segmentId, data) => {
    setSaving(true);
    try {
      const updated = await updateSegment(projectId, segmentId, data);
      setProject((prev) => ({
        ...prev,
        segments: prev.segments.map((s) => (s.id === segmentId ? { ...s, ...updated } : s)),
      }));
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const handleConfirm = useCallback(async (segmentId) => {
    setSaving(true);
    try {
      const updated = await confirmSegment(projectId, segmentId);
      setProject((prev) => ({
        ...prev,
        segments: prev.segments.map((s) => (s.id === segmentId ? { ...s, ...updated } : s)),
      }));
      // Move to next unconfirmed segment
      setProject((prev) => {
        const idx = prev.segments.findIndex((s) => s.id === segmentId);
        const next = prev.segments.slice(idx + 1).find((s) => s.status !== 'confirmed');
        if (next) {
          setActiveSegmentId(next.id);
          loadSidebarData(next.source);
        }
        return prev;
      });
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  function applyTMMatch(match) {
    if (!activeSegmentId) return;
    handleSegmentUpdate(activeSegmentId, { target: match.target, status: 'translated' });
  }

  if (!project) return <div className="loading">Loading...</div>;

  const filteredSegments = project.segments.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.source.toLowerCase().includes(q) || s.target.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: project.segments.length,
    draft: project.segments.filter((s) => s.status === 'draft').length,
    translated: project.segments.filter((s) => s.status === 'translated').length,
    confirmed: project.segments.filter((s) => s.status === 'confirmed').length,
  };
  const progress = stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0;

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button className="btn" onClick={() => navigate('/')}>← Back</button>
          <h2>{project.name}</h2>
          <span className="lang-badge">
            {project.sourceLang.toUpperCase()} → {project.targetLang.toUpperCase()}
          </span>
        </div>
        <div className="toolbar-center">
          <div className="stats">
            <span className="stat draft">{stats.draft} Draft</span>
            <span className="stat translated">{stats.translated} Translated</span>
            <span className="stat confirmed">{stats.confirmed} Confirmed</span>
            <span className="stat progress">{progress}%</span>
          </div>
        </div>
        <div className="toolbar-right">
          {saving && <span className="saving-indicator">Saving...</span>}
          <button className="btn primary" onClick={() => exportProject(projectId)}>
            Export XLIFF
          </button>
        </div>
      </div>

      <div className="editor-filters">
        <div className="filter-buttons">
          {['all', 'draft', 'translated', 'confirmed'].map((f) => (
            <button
              key={f}
              className={`btn small ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search segments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="editor-layout">
        <div className="segment-grid">
          <div className="grid-header">
            <span className="col-num">#</span>
            <span className="col-source">Source ({project.sourceLang.toUpperCase()})</span>
            <span className="col-target">Target ({project.targetLang.toUpperCase()})</span>
            <span className="col-status">Status</span>
            <span className="col-actions">Actions</span>
          </div>
          <div className="grid-body">
            {filteredSegments.map((segment, i) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                index={project.segments.indexOf(segment) + 1}
                isActive={segment.id === activeSegmentId}
                glossaryTerms={glossaryMatches}
                onFocus={() => handleSegmentFocus(segment)}
                onUpdate={(data) => handleSegmentUpdate(segment.id, data)}
                onConfirm={() => handleConfirm(segment.id)}
              />
            ))}
          </div>
        </div>

        <div className="sidebar">
          <TMPanel matches={tmMatches} onApply={applyTMMatch} />
          <GlossaryPanel matches={glossaryMatches} />
        </div>
      </div>
    </div>
  );
}
