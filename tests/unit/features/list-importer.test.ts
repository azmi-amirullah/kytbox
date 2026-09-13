import { describe, it, expect } from 'vitest';
import {
  parseImportContent,
  parseCsvBoard,
  parseTrelloBoard,
} from '@/features/list/lib/board-importer';

describe('1-Click Trello & Notion Board Importer (Day 18)', () => {
  describe('Trello JSON Importer (parseTrelloBoard)', () => {
    it('parses a full Trello board export with columns, cards, labels, and checklists', () => {
      const trelloJson = JSON.stringify({
        name: 'Sprint Alpha',
        desc: 'Sprint planning and backlog',
        lists: [
          { id: 'list-1', name: 'To Do', closed: false },
          { id: 'list-2', name: 'Doing', closed: false },
          { id: 'list-3', name: 'Archived List', closed: true },
        ],
        cards: [
          {
            id: 'card-1',
            idList: 'list-1',
            name: 'Set up Supabase RLS',
            desc: 'Configure policies for list_labels and items',
            due: '2026-09-20T12:00:00.000Z',
            closed: false,
            labels: [{ name: 'Backend' }, { name: 'Security' }],
            idChecklists: ['chk-1'],
          },
          {
            id: 'card-2',
            idList: 'list-2',
            name: 'Design tokens in Tailwind',
            desc: null,
            due: null,
            closed: false,
            labels: [{ name: 'Design' }],
            idChecklists: [],
          },
          {
            id: 'card-3',
            idList: 'list-1',
            name: 'Deleted card',
            closed: true, // should be ignored
          },
        ],
        checklists: [
          {
            id: 'chk-1',
            name: 'Acceptance Criteria',
            checkItems: [
              { id: 'item-1', name: 'Write migration', state: 'complete' },
              { id: 'item-2', name: 'Run tests', state: 'incomplete' },
            ],
          },
        ],
      });

      const parsed = parseTrelloBoard(trelloJson)!;
      expect(parsed.source).toBe('trello');
      expect(parsed.boardTitle).toBe('Sprint Alpha');
      expect(parsed.columns).toEqual(['To Do', 'Doing']);
      expect(parsed.cards).toHaveLength(2);

      const card1 = parsed.cards[0];
      expect(card1.title).toBe('Set up Supabase RLS');
      expect(card1.columnName).toBe('To Do');
      expect(card1.dueDate).toBe('2026-09-20');
      expect(card1.labels).toEqual(['Backend', 'Security']);
      expect(card1.subtasks).toEqual([
        { title: 'Write migration', isCompleted: true },
        { title: 'Run tests', isCompleted: false },
      ]);

      const card2 = parsed.cards[1];
      expect(card2.title).toBe('Design tokens in Tailwind');
      expect(card2.columnName).toBe('Doing');
      expect(card2.labels).toEqual(['Design']);
      expect(card2.subtasks).toEqual([]);
    });

    it('handles cards with missing lists or empty checklists gracefully', () => {
      const trelloJson = JSON.stringify({
        name: 'Empty Lists Board',
        lists: [],
        cards: [{ id: 'c1', name: 'Orphan card', closed: false }],
      });
      const parsed = parseTrelloBoard(trelloJson)!;
      expect(parsed.cards).toHaveLength(1);
      expect(parsed.cards[0].columnName).toBe('To Do'); // Default fallback column
    });
  });

  describe('CSV & Notion Board Importer (parseCsvBoard)', () => {
    it('strips UTF-8 BOM automatically and auto-detects standard columns', () => {
      // UTF-8 BOM is \uFEFF
      const csvWithBom =
        '\uFEFFTitle,Column,Description,Due Date,Labels,Priority\n' +
        '"Implement Webhook","In Progress","Deliver payload safely","2026-09-15","API, Webhook","high"\n' +
        '"Write Documentation","Done","Update docs/roadmap","2026-09-18","Docs","medium"\n';

      const parsed = parseCsvBoard(csvWithBom);
      expect(parsed.source).toBe('csv');
      expect(parsed.columns).toEqual(['In Progress', 'Done']);
      expect(parsed.cards).toHaveLength(2);

      const card1 = parsed.cards[0];
      expect(card1.title).toBe('Implement Webhook');
      expect(card1.columnName).toBe('In Progress');
      expect(card1.description).toBe('Deliver payload safely');
      expect(card1.dueDate).toBe('2026-09-15');
      expect(card1.labels).toEqual(['API', 'Webhook']);
      expect(card1.priority).toBe('high');
    });

    it('parses Notion CSV exports with custom column mapping', () => {
      const notionCsv =
        'Name,Status,Notes,Date,Tags\n' +
        'Refactor UI,Doing,Use Shadcn tokens,2026-10-01,Frontend;UI\n' +
        'Add Redis Cache,Backlog,,2026-10-05,Infra\n';

      const parsed = parseCsvBoard(notionCsv, {
        title: 'Name',
        column: 'Status',
        description: 'Notes',
        dueDate: 'Date',
        labels: 'Tags',
      });

      expect(parsed.cards).toHaveLength(2);
      expect(parsed.cards[0].title).toBe('Refactor UI');
      expect(parsed.cards[0].columnName).toBe('Doing');
      expect(parsed.cards[0].description).toBe('Use Shadcn tokens');
      expect(parsed.cards[0].labels).toEqual(['Frontend', 'UI']);
      expect(parsed.cards[1].columnName).toBe('Backlog');
    });

    it('falls back safely when input CSV is empty or has invalid headers', () => {
      const emptyCsv = '';
      const parsed = parseCsvBoard(emptyCsv);
      expect(parsed.cards).toHaveLength(0);
      expect(parsed.columns).toHaveLength(0);
    });
  });

  describe('Auto-detection router (parseImportContent)', () => {
    it('detects JSON vs CSV based on content or file extension', () => {
      const jsonStr = '{"name": "My Board", "lists": [], "cards": []}';
      const jsonRes = parseImportContent(jsonStr, 'board.json');
      expect(jsonRes.source).toBe('trello');

      const csvStr = 'Title,Column\nCard 1,Done';
      const csvRes = parseImportContent(csvStr, 'board.csv');
      expect(csvRes.source).toBe('csv');
    });
  });
});
