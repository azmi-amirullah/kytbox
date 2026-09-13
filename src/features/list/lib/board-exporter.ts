import type { ListColumnDTO, ListItemDTO } from '@/types/dto';

/**
 * Sanitizes a cell string against CSV Formula Injection (CWE-1236).
 * Prepends a single quote (') if the field starts with '=', '+', '-', or '@'.
 */
export function sanitizeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '""';
  let str = String(raw).trim();

  // Neutralize spreadsheet formula execution (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape existing double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export interface BoardExportData {
  title: string;
  description?: string | null;
  columns: ListColumnDTO[];
  items: ListItemDTO[];
}

/**
 * Exports board to a structured CSV format with CWE-1236 defense.
 */
export function exportBoardToCSV(board: BoardExportData): string {
  const headers = ['Column', 'Title', 'Completed', 'Priority', 'Due Date', 'Labels', 'Description'];
  const rows: string[] = [];
  rows.push(headers.map(sanitizeCsvCell).join(','));

  const sortedColumns = [...board.columns].sort((a, b) => a.sort_order - b.sort_order);

  for (const col of sortedColumns) {
    const colItems = board.items
      .filter((i) => i.column_id === col.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const item of colItems) {
      const labelsStr = item.labels && item.labels.length > 0 ? item.labels.join(', ') : '';
      const row = [
        col.title,
        item.title,
        item.is_completed ? 'Yes' : 'No',
        item.priority ? item.priority.toUpperCase() : 'None',
        item.due_date || '',
        labelsStr,
        item.description || '',
      ];
      rows.push(row.map(sanitizeCsvCell).join(','));
    }
  }

  return rows.join('\r\n');
}

/**
 * Exports board to a clean, hierarchical Markdown checklist document.
 */
export function exportBoardToMarkdown(board: BoardExportData): string {
  const lines: string[] = [];

  lines.push(`# ${board.title}`);
  if (board.description?.trim()) {
    lines.push(`> ${board.description.trim()}`);
    lines.push('');
  } else {
    lines.push('');
  }

  const sortedColumns = [...board.columns].sort((a, b) => a.sort_order - b.sort_order);

  for (const col of sortedColumns) {
    const colItems = board.items
      .filter((i) => i.column_id === col.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    lines.push(`## ${col.title} (${colItems.length})`);
    lines.push('');

    if (colItems.length === 0) {
      lines.push('_(No cards in this column)_');
      lines.push('');
      continue;
    }

    for (const item of colItems) {
      const check = item.is_completed ? '[x]' : '[ ]';
      let metaDetails = '';

      if (item.due_date) {
        metaDetails += ` 📅 Due: ${item.due_date}`;
      }
      if (item.priority) {
        metaDetails += ` 🚩 [${item.priority.toUpperCase()}]`;
      }
      if (item.labels && item.labels.length > 0) {
        metaDetails += ` ${item.labels.map((l) => `#${l}`).join(' ')}`;
      }

      lines.push(`- ${check} **${item.title}**${metaDetails}`);

      if (item.description?.trim()) {
        lines.push(`  ${item.description.trim().replace(/\n/g, '\n  ')}`);
      }

      if (item.subtasks && item.subtasks.length > 0) {
        const sortedSubtasks = [...item.subtasks].sort(
          (a, b) => a.position - b.position,
        );
        for (const sub of sortedSubtasks) {
          const subCheck = sub.is_completed ? '[x]' : '[ ]';
          lines.push(`  - ${subCheck} ${sub.title}`);
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Initiates browser file download for exported text content.
 */
export function triggerBrowserDownload(
  content: string,
  filename: string,
  contentType: string,
) {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
