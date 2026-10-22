import { afterEach, expect, test, vi } from 'vitest';
const orange = require('../src');

afterEach(() => { vi.unstubAllGlobals(); });

test('deletion is idempotent and preserves unrelated files', async () => {
	const files = new Set(['account.db', 'account.db-wal', 'photo.jpg', 'other.db']);
	vi.stubGlobal('navigator', { storage: { getDirectory: async () => ({
		removeEntry: async name => { if (!files.delete(name)) throw { name: 'NotFoundError' }; }
	}) } });
	await orange.deleteSqliteOPFS('account.db', { vfs: 'opfs-wl' });
	await orange.deleteSqliteOPFS('account.db', { vfs: 'opfs-wl' });
	expect([...files]).toEqual(['photo.jpg', 'other.db']);
});

test('storage failures propagate, so callers can retry incomplete deletion', async () => {
	const removeEntry = vi.fn().mockRejectedValue(Object.assign(new Error('Locked'), { name: 'NoModificationAllowedError' }));
	vi.stubGlobal('navigator', { storage: { getDirectory: async () => ({ removeEntry }) } });
	await expect(orange.deleteSqliteOPFS('account.sqlite3', { vfs: 'opfs-sahpool', sync: true })).rejects.toThrow('Locked');
	removeEntry.mockResolvedValue(undefined);
	await orange.deleteSqliteOPFS('account.sqlite3', { vfs: 'opfs-sahpool', sync: true });
	expect(removeEntry).toHaveBeenCalledTimes(4);
});

test('refuses root/traversal deletion and unavailable storage', async () => {
	const removeEntry = vi.fn();
	vi.stubGlobal('navigator', { storage: { getDirectory: async () => ({ removeEntry }) } });
	for (const directory of ['/', '.', '..', 'safe/../other'])
		await expect(orange.deleteSqliteOPFS('account.db', { vfs: 'opfs-sahpool', opfsSahPool: { directory } })).rejects.toThrow('invalid OPFS');
	expect(removeEntry).not.toHaveBeenCalled();
	vi.stubGlobal('navigator', {});
	await expect(orange.deleteSqliteOPFS('account.db', { vfs: 'opfs-wl' })).rejects.toThrow('unavailable');
});
