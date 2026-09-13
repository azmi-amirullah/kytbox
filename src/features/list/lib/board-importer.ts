import Papa from 'papaparse';
import { format, isValid } from 'date-fns';
import type { ListItemPriority } from '@/types/dto';

export interface ParsedImportCard {
  title: string;
  columnTitle: string;
  columnName?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: ListItemPriority | null;
  labels?: string[];
  subtasks?: { title: string; isCompleted: boolean }[];
}

export interface ParsedImportData {
  source: 'trello' | 'trello_json' | 'csv' | 'generic_json';
  boardName?: string;
  boardTitle?: string;
  columns: string[];
  cards: ParsedImportCard[];
  rawHeaders?: string[];
}

export interface CsvColumnMapping {
  title: string;
  column: string;
  columnMapping?: string;
  dueDate?: string;
  priority?: string;
  description?: string;
  labels?: string;
}

/**
 * Strips UTF-8 Byte Order Mark (BOM) from string to avoid header detection corruption.
 */
export function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, '').trim();
}

/**
 * Normalizes priority strings into valid ListItemPriority.
 */
export function normalizePriority(raw: unknown): ListItemPriority | null {
  if (typeof raw !== 'string') return null;
  const p = raw.trim().toLowerCase();
  if (['urgent', 'p1', 'critical', 'darurat'].includes(p)) return 'urgent';
  if (['high', 'p2', 'tinggi', 'major'].includes(p)) return 'high';
  if (['medium', 'p3', 'normal', 'sedang', 'med'].includes(p)) return 'medium';
  if (['low', 'p4', 'rendah', 'minor'].includes(p)) return 'low';
  return null;
}

/**
 * Normalizes due date string into YYYY-MM-DD or null.
 */
export function normalizeDueDate(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Direct YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new Date(trimmed);
    if (isValid(parsed) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {
    // Ignore invalid dates
  }

  return null;
}

/**
 * Auto-detects best matching column headers in CSV files.
 */
export function detectCsvColumns(headers: string[]): CsvColumnMapping {
  const cleanHeaders = headers.map((h) => h.trim());
  const findMatch = (patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = cleanHeaders.find((h) => pattern.test(h.toLowerCase()));
      if (match) return match;
    }
    return '';
  };

  const titleCol = findMatch([
    /^title$/i,
    /^name$/i,
    /^card\s*name$/i,
    /^task$/i,
    /^task\s*name$/i,
    /^nama$/i,
    /^item$/i,
    /^summary$/i,
  ]) || cleanHeaders[0] || '';

  const columnCol = findMatch([
    /^status$/i,
    /^column$/i,
    /^column\s*name$/i,
    /^list$/i,
    /^list\s*name$/i,
    /^stage$/i,
    /^phase$/i,
    /^tahap$/i,
    /^state$/i,
  ]) || cleanHeaders[1] || '';

  const dueDateCol = findMatch([
    /^due\s*date$/i,
    /^due$/i,
    /^deadline$/i,
    /^target\s*date$/i,
    /^tenggat$/i,
    /^date$/i,
  ]);

  const priorityCol = findMatch([
    /^priority$/i,
    /^urgency$/i,
    /^prioritas$/i,
    /^prio$/i,
    /^level$/i,
  ]);

  const descriptionCol = findMatch([
    /^description$/i,
    /^desc$/i,
    /^notes$/i,
    /^details$/i,
    /^keterangan$/i,
    /^deskripsi$/i,
  ]);

  const labelsCol = findMatch([
    /^labels$/i,
    /^tags$/i,
    /^label$/i,
    /^tag$/i,
    /^kategori$/i,
    /^category$/i,
  ]);

  return {
    title: titleCol,
    column: columnCol,
    dueDate: dueDateCol || undefined,
    priority: priorityCol || undefined,
    description: descriptionCol || undefined,
    labels: labelsCol || undefined,
  };
}

/**
 * Parses Trello export JSON structure.
 */
export function parseTrelloJson(jsonText: string): ParsedImportData | null {
  try {
    const raw = JSON.parse(stripBom(jsonText));
    if (!raw || typeof raw !== 'object') return null;

    // Verify minimum Trello structure
    if (!Array.isArray(raw.lists) && !Array.isArray(raw.cards)) {
      return null;
    }

    const listMap = new Map<string, string>();
    const activeColumns: string[] = [];

    if (Array.isArray(raw.lists)) {
      for (const list of raw.lists) {
        if (!list.closed && list.name) {
          listMap.set(list.id, list.name);
          if (!activeColumns.includes(list.name)) {
            activeColumns.push(list.name);
          }
        }
      }
    }

    // Build checklist map
    const checklistMap = new Map<string, { title: string; isCompleted: boolean }[]>();
    if (Array.isArray(raw.checklists)) {
      for (const chk of raw.checklists) {
        if (chk.id && Array.isArray(chk.checkItems)) {
          const items = chk.checkItems
            .map((ci: { name?: string; state?: string }) => ({
              title: String(ci.name || '').trim(),
              isCompleted: ci.state === 'complete',
            }))
            .filter((ci: { title: string }) => ci.title.length > 0);
          checklistMap.set(chk.id, items);
        }
      }
    }

    const cards: ParsedImportCard[] = [];
    if (Array.isArray(raw.cards)) {
      for (const card of raw.cards) {
        if (card.closed) continue; // Skip archived cards
        const columnTitle = listMap.get(card.idList) || activeColumns[0] || 'To Do';
        const labels: string[] = [];
        if (Array.isArray(card.labels)) {
          for (const l of card.labels) {
            if (l.name && typeof l.name === 'string') {
              labels.push(l.name.trim());
            }
          }
        }

        const subtasks: { title: string; isCompleted: boolean }[] = [];
        if (Array.isArray(card.idChecklists)) {
          for (const chkId of card.idChecklists) {
            const list = checklistMap.get(chkId);
            if (list) {
              subtasks.push(...list);
            }
          }
        }

        cards.push({
          title: String(card.name || 'Untitled Card').trim(),
          columnTitle,
          columnName: columnTitle,
          description: card.desc ? String(card.desc).trim() : null,
          dueDate: normalizeDueDate(card.due),
          priority: null,
          labels: labels.length > 0 ? labels : undefined,
          subtasks,
        });
      }
    }

    if (activeColumns.length === 0 && cards.length > 0) {
      activeColumns.push('To Do', 'In Progress', 'Done');
    }

    return {
      source: 'trello',
      boardName: raw.name ? String(raw.name) : undefined,
      boardTitle: raw.name ? String(raw.name) : undefined,
      columns: activeColumns,
      cards,
    };
  } catch {
    return null;
  }
}

export const parseTrelloBoard = parseTrelloJson;

/**
 * Parses CSV text using PapaParse with automatic or custom column mapping.
 */
export function parseCsvBoard(
  csvText: string,
  customMapping?: Partial<CsvColumnMapping>,
): ParsedImportData {
  const clean = stripBom(csvText);
  const parsed = Papa.parse<Record<string, string>>(clean, {
    header: true,
    skipEmptyLines: true,
  });

  const rawHeaders = parsed.meta.fields || [];
  const detected = detectCsvColumns(rawHeaders);
  const mapping: CsvColumnMapping = {
    title: customMapping?.title || detected.title,
    column: customMapping?.column || customMapping?.columnMapping || detected.column,
    dueDate: customMapping?.dueDate || detected.dueDate,
    priority: customMapping?.priority || detected.priority,
    description: customMapping?.description || detected.description,
    labels: customMapping?.labels || detected.labels,
  };

  const columnsSet = new Set<string>();
  const cards: ParsedImportCard[] = [];

  for (const row of parsed.data) {
    const titleVal = mapping.title ? row[mapping.title] : undefined;
    if (!titleVal || !titleVal.trim()) continue;

    const colVal = (mapping.column && row[mapping.column]?.trim()) || 'To Do';
    columnsSet.add(colVal);

    const descVal = mapping.description ? row[mapping.description]?.trim() : null;
    const dueVal = mapping.dueDate ? normalizeDueDate(row[mapping.dueDate]) : null;
    const prioVal = mapping.priority ? normalizePriority(row[mapping.priority]) : null;

    let labels: string[] | undefined = undefined;
    if (mapping.labels && row[mapping.labels]) {
      const split = row[mapping.labels]
        .split(/[,;]+/)
        .map((l) => l.trim().replace(/^#/, ''))
        .filter(Boolean);
      if (split.length > 0) labels = split;
    }

    cards.push({
      title: titleVal.trim(),
      columnTitle: colVal,
      columnName: colVal,
      description: descVal || null,
      dueDate: dueVal,
      priority: prioVal,
      labels,
    });
  }

  const columns = Array.from(columnsSet);
  if (columns.length === 0 && cards.length > 0) {
    columns.push('To Do', 'In Progress', 'Done');
  }

  return {
    source: 'csv',
    columns,
    cards,
    rawHeaders,
  };
}

/**
 * Universal board import dispatcher: parses either Trello JSON or Notion/CSV files.
 */
export function parseImportContent(
  content: string,
  filename: string,
  customMapping?: Partial<CsvColumnMapping>,
): ParsedImportData {
  const isJson = filename.toLowerCase().endsWith('.json') || content.trim().startsWith('{');
  if (isJson) {
    const trelloResult = parseTrelloJson(content);
    if (trelloResult) return trelloResult;
  }

  return parseCsvBoard(content, customMapping);
}

