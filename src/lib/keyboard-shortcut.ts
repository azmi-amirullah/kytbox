import { useSyncExternalStore } from 'react';

export type CommandShortcut = '⌘K' | 'Ctrl+K';

export function getCommandShortcut(platform?: string): CommandShortcut {
  const resolvedPlatform =
    platform ??
    (typeof navigator !== 'undefined'
      ? navigator.platform + ' ' + navigator.userAgent
      : '');

  return /Mac|iPhone|iPad|iPod/i.test(resolvedPlatform) ? '⌘K' : 'Ctrl+K';
}

const subscribeToPlatform = () => () => {};
const getServerShortcut = (): CommandShortcut => 'Ctrl+K';

export function useCommandShortcut(): CommandShortcut {
  return useSyncExternalStore(
    subscribeToPlatform,
    getCommandShortcut,
    getServerShortcut,
  );
}
