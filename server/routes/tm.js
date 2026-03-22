const express = require('express');
const store = require('../services/store');
const { findMatches, addEntry } = require('../services/tmEngine');

const router = express.Router();

// Get all TM entries
router.get('/', (req, res) => {
  res.json(store.tm);
});

// Search TM
router.get('/search', (req, res) => {
  const { q, min = 50 } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
  const matches = findMatches(q, parseInt(min));
  res.json(matches);
});

// Add a TM entry
router.post('/', (req, res) => {
  const { source, target, sourceLang = 'en', targetLang = 'fr' } = req.body;
  if (!source || !target) {
    return res.status(400).json({ error: 'source and target are required' });
  }
  addEntry(source, target, sourceLang, targetLang);
  res.json({ success: true });
});

// Delete a TM entry
router.delete('/:index', (req, res) => {
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= store.tm.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  store.tm.splice(idx, 1);
  store.saveTM();
  res.json({ success: true });
});

// Import TM from uploaded project (batch add)
router.post('/import-project/:projectId', (req, res) => {
  const project = store.projects.find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  let added = 0;
  for (const seg of project.segments) {
    if (seg.target && seg.status === 'confirmed') {
      addEntry(seg.source, seg.target, project.sourceLang, project.targetLang);
      added++;
    }
  }

  res.json({ success: true, added });
});

module.exports = router;
