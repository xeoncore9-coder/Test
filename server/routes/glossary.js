const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../services/store');

const router = express.Router();

// Get all glossary entries
router.get('/', (req, res) => {
  res.json(store.glossary);
});

// Search glossary
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  const query = q.toLowerCase();
  const matches = store.glossary.filter(
    (entry) =>
      entry.source.toLowerCase().includes(query) ||
      entry.target.toLowerCase().includes(query)
  );
  res.json(matches);
});

// Add glossary entry
router.post('/', (req, res) => {
  const { source, target, sourceLang = 'en', targetLang = 'fr', notes = '' } = req.body;
  if (!source || !target) {
    return res.status(400).json({ error: 'source and target are required' });
  }

  const entry = {
    id: uuidv4(),
    source,
    target,
    sourceLang,
    targetLang,
    notes,
    createdAt: new Date().toISOString(),
  };

  store.glossary.push(entry);
  store.saveGlossary();
  res.json(entry);
});

// Update glossary entry
router.put('/:id', (req, res) => {
  const entry = store.glossary.find((e) => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const { source, target, notes } = req.body;
  if (source !== undefined) entry.source = source;
  if (target !== undefined) entry.target = target;
  if (notes !== undefined) entry.notes = notes;

  store.saveGlossary();
  res.json(entry);
});

// Delete glossary entry
router.delete('/:id', (req, res) => {
  const idx = store.glossary.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });

  store.glossary.splice(idx, 1);
  store.saveGlossary();
  res.json({ success: true });
});

// Check text against glossary (highlight terms)
router.post('/check', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const found = [];
  const textLower = text.toLowerCase();

  for (const entry of store.glossary) {
    if (textLower.includes(entry.source.toLowerCase())) {
      found.push(entry);
    }
  }

  res.json(found);
});

module.exports = router;
