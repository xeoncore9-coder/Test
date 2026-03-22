const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const xml2js = require('xml2js');

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  switch (ext) {
    case '.txt':
      return parseTxt(filePath);
    case '.docx':
      return parseDocx(filePath);
    case '.xliff':
    case '.xlf':
      return parseXliff(filePath);
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

function parseTxt(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return { text: content, metadata: { format: 'txt' } };
}

async function parseDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return { text: result.value, metadata: { format: 'docx' } };
}

async function parseXliff(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(content);

  const segments = [];
  const xliff = result.xliff;
  const files = Array.isArray(xliff.file) ? xliff.file : [xliff.file];

  for (const file of files) {
    const body = file.body;
    const units = body['trans-unit'] || body.unit || [];
    const unitList = Array.isArray(units) ? units : [units];

    for (const unit of unitList) {
      const source = typeof unit.source === 'string' ? unit.source : unit.source?._ || '';
      const target = typeof unit.target === 'string' ? unit.target : unit.target?._ || '';

      if (source) {
        segments.push({ source: source.trim(), target: target.trim() });
      }
    }
  }

  return {
    text: null,
    segments,
    metadata: {
      format: 'xliff',
      sourceLang: files[0]?.$?.['source-language'] || 'unknown',
      targetLang: files[0]?.$?.['target-language'] || 'unknown',
    },
  };
}

module.exports = { parseFile };
