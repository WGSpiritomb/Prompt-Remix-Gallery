import { StylePreset, CSVParseResult } from '../types';

/**
 * Standard RFC 4180 compliant CSV parser.
 * Handles multiline fields within double quotes, escaped quotes (""),
 * and various line-endings (\r\n, \r, \n).
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0].trim() === '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0].trim() === '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Push last remaining field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0].trim() === '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse styles.csv text into StylePreset array with validation and header detection
 */
export function parseStylesCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];
  const presets: StylePreset[] = [];

  if (!csvText || !csvText.trim()) {
    return {
      presets: [],
      errors: ['The CSV file is empty.'],
      totalRows: 0,
      validRows: 0,
    };
  }

  const rawRows = parseCSV(csvText);

  if (rawRows.length === 0) {
    return {
      presets: [],
      errors: ['No rows could be parsed from the CSV file.'],
      totalRows: 0,
      validRows: 0,
    };
  }

  const headerRow = rawRows[0].map(h => h.trim().toLowerCase());
  
  // Find column indices
  let nameIndex = headerRow.findIndex(h => h === 'name' || h === 'style' || h === 'title');
  let promptIndex = headerRow.findIndex(h => h === 'prompt' || h === 'positive' || h === 'positive_prompt');
  let negativeIndex = headerRow.findIndex(
    h => h === 'negative_prompt' || h === 'negative' || h === 'neg_prompt' || h === 'negative prompt'
  );
  let imageIndex = headerRow.findIndex(
    h => h === 'image_url' || h === 'image' || h === 'preview_url' || h === 'preview' || h === 'img'
  );

  let hasHeaders = true;

  // If no header matches, check if it's a headerless CSV formatted as name,prompt,negative_prompt
  if (nameIndex === -1 && promptIndex === -1) {
    hasHeaders = false;
    nameIndex = 0;
    promptIndex = 1;
    negativeIndex = 2;
    imageIndex = 3;
  } else {
    // Defaults if some headers were found but others weren't
    if (nameIndex === -1) nameIndex = 0;
    if (promptIndex === -1) promptIndex = 1;
    if (negativeIndex === -1) negativeIndex = 2;
  }

  const dataRows = hasHeaders ? rawRows.slice(1) : rawRows;
  let totalRows = dataRows.length;

  dataRows.forEach((row, idx) => {
    const rowNum = hasHeaders ? idx + 2 : idx + 1;
    
    // Ignore completely blank rows
    if (row.every(c => !c.trim())) {
      return;
    }

    const name = (row[nameIndex] || '').trim();
    const prompt = (row[promptIndex] || '').trim();
    const negative_prompt = (row[negativeIndex] || '').trim();
    const image_url = imageIndex >= 0 && row[imageIndex] ? row[imageIndex].trim() : undefined;

    if (!name && !prompt) {
      errors.push(`Row ${rowNum}: Skipped because both name and prompt were empty.`);
      return;
    }

    presets.push({
      id: `style_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      name: name || `Preset #${presets.length + 1}`,
      prompt: prompt,
      negative_prompt: negative_prompt,
      image_url: image_url || undefined,
      createdAt: Date.now() - (dataRows.length - idx) * 1000,
    });
  });

  return {
    presets,
    errors,
    totalRows,
    validRows: presets.length,
  };
}

/**
 * Escapes a field according to standard CSV rules (RFC 4180)
 */
function escapeCSVField(field: string | undefined): string {
  if (field === undefined || field === null) {
    return '';
  }
  const str = String(field);
  // If field contains comma, double quote, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Strict export function outputting headers: name,prompt,negative_prompt
 */
export function exportToStrictCSV(presets: StylePreset[]): string {
  const headers = ['name', 'prompt', 'negative_prompt'];
  const lines: string[] = [headers.join(',')];

  for (const preset of presets) {
    const name = escapeCSVField(preset.name);
    const prompt = escapeCSVField(preset.prompt);
    const negative = escapeCSVField(preset.negative_prompt);
    lines.push(`${name},${prompt},${negative}`);
  }

  return lines.join('\n');
}

/**
 * Extended export function that includes image_url if present
 */
export function exportToExtendedCSV(presets: StylePreset[]): string {
  const headers = ['name', 'prompt', 'negative_prompt', 'image_url'];
  const lines: string[] = [headers.join(',')];

  for (const preset of presets) {
    const name = escapeCSVField(preset.name);
    const prompt = escapeCSVField(preset.prompt);
    const negative = escapeCSVField(preset.negative_prompt);
    const img = escapeCSVField(preset.image_url || '');
    lines.push(`${name},${prompt},${negative},${img}`);
  }

  return lines.join('\n');
}

/**
 * Trigger browser file download of CSV content
 */
export function downloadCSV(csvContent: string, filename = 'styles.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
