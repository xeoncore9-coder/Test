const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { parseFile } = require('../services/fileParser');
const { segmentText } = require('../services/segmenter');
const { findMatches } = require('../services/tmEngine');
const store = require('../services/store');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.docx', '.xliff', '.xlf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  },
});

// List all projects
router.get('/', (req, res) => {
  const summary = store.projects.map((p) => ({
    id: p.id,
    name: p.name,
    fileName: p.fileName,
    sourceLang: p.sourceLang,
    targetLang: p.targetLang,
    segmentCount: p.segments.length,
    progress: getProgress(p.segments),
    createdAt: p.createdAt,
  }));
  res.json(summary);
});

// Get a project with all segments
router.get('/:id', (req, res) => {
  const project = store.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Upload a file and create a project
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { sourceLang = 'en', targetLang = 'fr', name } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const parsed = await parseFile(file.path, file.originalname);
    let segments;

    if (parsed.segments) {
      // XLIFF already has segments
      segments = parsed.segments.map((s) => ({
        id: uuidv4(),
        source: s.source,
        target: s.target || '',
        status: s.target ? 'translated' : 'draft',
        locked: false,
        comment: '',
      }));
    } else {
      segments = segmentText(parsed.text);
    }

    // Find TM matches for each segment
    segments = segments.map((seg) => {
      const tmMatches = findMatches(seg.source);
      return { ...seg, tmMatches };
    });

    const project = {
      id: uuidv4(),
      name: name || file.originalname,
      fileName: file.originalname,
      sourceLang,
      targetLang,
      segments,
      metadata: parsed.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.projects.push(project);
    store.saveProjects();

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a segment
router.put('/:projectId/segments/:segmentId', (req, res) => {
  const project = store.projects.find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const segment = project.segments.find((s) => s.id === req.params.segmentId);
  if (!segment) return res.status(404).json({ error: 'Segment not found' });

  const { target, status, locked, comment } = req.body;
  if (target !== undefined) segment.target = target;
  if (status !== undefined) segment.status = status;
  if (locked !== undefined) segment.locked = locked;
  if (comment !== undefined) segment.comment = comment;

  project.updatedAt = new Date().toISOString();
  store.saveProjects();

  res.json(segment);
});

// Confirm a segment (mark confirmed + add to TM)
router.post('/:projectId/segments/:segmentId/confirm', (req, res) => {
  const project = store.projects.find((p) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const segment = project.segments.find((s) => s.id === req.params.segmentId);
  if (!segment) return res.status(404).json({ error: 'Segment not found' });

  if (!segment.target) {
    return res.status(400).json({ error: 'Cannot confirm empty translation' });
  }

  segment.status = 'confirmed';
  project.updatedAt = new Date().toISOString();
  store.saveProjects();

  // Add to TM
  const { addEntry } = require('../services/tmEngine');
  addEntry(segment.source, segment.target, project.sourceLang, project.targetLang);

  res.json(segment);
});

// Export project as XLIFF
router.get('/:id/export', (req, res) => {
  const project = store.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const xliff = generateXliff(project);
  res.setHeader('Content-Type', 'application/xliff+xml');
  res.setHeader('Content-Disposition', `attachment; filename="${project.name}.xliff"`);
  res.send(xliff);
});

// Delete project
router.delete('/:id', (req, res) => {
  const idx = store.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  store.projects.splice(idx, 1);
  store.saveProjects();
  res.json({ success: true });
});

function getProgress(segments) {
  if (!segments.length) return 0;
  const done = segments.filter((s) => s.status === 'confirmed').length;
  return Math.round((done / segments.length) * 100);
}

function generateXliff(project) {
  const units = project.segments
    .map(
      (seg, i) =>
        `      <trans-unit id="${i + 1}">
        <source>${escapeXml(seg.source)}</source>
        <target>${escapeXml(seg.target)}</target>
      </trans-unit>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="${project.sourceLang}" target-language="${project.targetLang}" datatype="plaintext" original="${project.fileName}">
    <body>
${units}
    </body>
  </file>
</xliff>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = router;
