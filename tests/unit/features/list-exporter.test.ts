import { describe, it, expect } from 'vitest';
import {
  exportBoardToMarkdown,
  exportBoardToCSV,
  sanitizeCsvCell,
} from '@/features/list/lib/board-exporter';
import type { ListColumnDTO, ListItemDTO } from '@/types/dto';

describe('Board Data Export Engine & CWE-1236 Defense (Day 19)', () => {
  const columns: ListColumnDTO[] = [
    {
      id: 'col-1',
      list_id: 'list-1',
      title: 'To Do',
      sort_order: 1,
      is_done_column: false,
      wip_limit: null,
    },
    {
      id: 'col-2',
      list_id: 'list-1',
      title: 'Done',
      sort_order: 2,
      is_done_column: true,
      wip_limit: null,
    },
  ];

  const items: ListItemDTO[] = [
    {
      id: 'item-1',
      list_id: 'list-1',
      column_id: 'col-1',
      title: 'Build Importer',
      description: 'Support Trello and Notion CSV',
      priority: 'high',
      is_completed: false,
      sort_order: 1000,
      due_date: '2026-09-25',
      labels: ['Dev', 'Feature'],
      metadata: {},
      created_at: '2026-09-01T00:00:00Z',
      subtasks: [
        { id: 'st-1', item_id: 'item-1', title: 'Write parser', is_completed: true, position: 1, created_at: '' },
        { id: 'st-2', item_id: 'item-1', title: 'Write UI modal', is_completed: false, position: 2, created_at: '' },
      ],
    },
    {
      id: 'item-2',
      list_id: 'list-1',
      column_id: 'col-2',
      title: '=cmd|"/C calc"!A0', // Dangerous formula injection payload!
      description: '@SUM(1, 2)',
      priority: null,
      is_completed: true,
      sort_order: 2000,
      due_date: null,
      labels: [],
      metadata: {},
      created_at: '2026-09-01T00:00:00Z',
    },
  ];

  describe('CWE-1236 Formula Injection Sanitization', () => {
    it('prepends a single quote to prevent spreadsheet execution of dangerous prefixes', () => {
      expect(sanitizeCsvCell('=1+1')).toBe('"\'=1+1"');
      expect(sanitizeCsvCell('+SUM(A1:A10)')).toBe('"\' +SUM(A1:A10)"'.replace(' ', ''));
      expect(sanitizeCsvCell('-50')).toBe('"\' -50"'.replace(' ', ''));
      expect(sanitizeCsvCell('\t=cmd')).toBe('"\'=cmd"');
      expect(sanitizeCsvCell('\r+SUM(A1)')).toBe('"\' +SUM(A1)"'.replace(' ', ''));
    });

    it('leaves standard text and numbers untouched except for CSV quote wrapping', () => {
      expect(sanitizeCsvCell('Normal Title')).toBe('"Normal Title"');
      expect(sanitizeCsvCell('Fix bug #123')).toBe('"Fix bug #123"');
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
    });
  });

  describe('Markdown Export (exportBoardToMarkdown)', () => {
    it('formats clean hierarchical Markdown with headings, checklists, and metadata', () => {
      const md = exportBoardToMarkdown({
        title: 'Project Roadmap',
        description: 'Q3 Development Sprint',
        columns,
        items,
      });

      expect(md).toContain('# Project Roadmap');
      expect(md).toContain('> Q3 Development Sprint');
      expect(md).toContain('## To Do (1)');
      expect(md).toContain('## Done (1)');
      expect(md).toContain('- [ ] **Build Importer** 📅 Due: 2026-09-25 🚩 [HIGH] #Dev #Feature');
      expect(md).toContain('Support Trello and Notion CSV');
      expect(md).toContain('- [x] Write parser');
      expect(md).toContain('- [ ] Write UI modal');
      expect(md).toContain('- [x] **=cmd|"/C calc"!A0**');
    });
  });

  describe('CSV Export (exportBoardToCSV)', () => {
    it('generates properly escaped CSV with formula injection neutralization', () => {
      const csv = exportBoardToCSV({
        title: 'Project Roadmap',
        columns,
        items,
      });

      // Headers exist
      expect(csv).toContain('"Column","Title","Completed","Priority","Due Date","Labels","Description"');

      // Regular item output
      expect(csv).toContain('"To Do","Build Importer","No","HIGH","2026-09-25","Dev, Feature","Support Trello and Notion CSV"');

      // Dangerous formula neutralized with leading single quote: '=cmd
      expect(csv).toContain('\'=cmd|""/C calc""!A0');
      expect(csv).toContain('\'@SUM(1, 2)');
    });
  });
});
