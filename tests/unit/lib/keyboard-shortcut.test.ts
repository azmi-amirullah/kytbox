import { describe, expect, it } from 'vitest';
import { getCommandShortcut } from '@/lib/keyboard-shortcut';

describe('getCommandShortcut', () => {
  it.each(['MacIntel', 'Macintosh', 'iPhone', 'iPad', 'iPod'])(
    'uses the Command key for %s',
    (platform) => {
      expect(getCommandShortcut(platform)).toBe('⌘K');
    },
  );

  it.each(['Win32', 'Linux x86_64', 'X11'])(
    'uses the Control key for %s',
    (platform) => {
      expect(getCommandShortcut(platform)).toBe('Ctrl+K');
    },
  );
});
