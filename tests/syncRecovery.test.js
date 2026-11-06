import { expect, test, vi } from 'vitest';
const createLifecycle = require('../src/client/syncLifecycle');
const createRecovery = require('../src/client/syncRecovery');
const { syncAbortSignalSymbol } = require('../src/client/syncAbort');

function fixture() {
	let recovery;
	const lifecycle = createLifecycle(() => recovery.assertReady(), error => recovery.observeError(error));
	const reset = vi.fn(async () => ({ reset: true }));
	const recover = vi.fn(async () => ({ reset: true, sent: 1, discarded: 2 }));
	const sync = vi.fn(async () => {});
	recovery = createRecovery(lifecycle, () => {}, reset, recover, sync);
	return { lifecycle, recovery, reset, recover, sync };
}

test('queued ordinary work and concurrent resets cannot enter recovery; different clients remain usable', async () => {
	const a = fixture(), b = fixture();
	let release;
	a.recover.mockImplementation(() => new Promise(resolve => { release = resolve; }));
	const work = vi.fn();
	const queued = a.lifecycle.run(work).catch(error => error);
	const recovering = a.recovery.recover();
	await vi.waitFor(() => expect(release).toBeTypeOf('function'));
	expect((await queued).code).toBe('ORANGE_SYNC_ABORT');
	expect(work).not.toHaveBeenCalled();
	await expect(a.recovery.reset()).rejects.toMatchObject({ code: 'ORANGE_SYNC_RECOVERY_BUSY' });
	await expect(a.lifecycle.start(work)).rejects.toMatchObject({ code: 'ORANGE_SYNC_SCHEMA_RECOVERY_BLOCKED' });
	await b.lifecycle.run(work);
	expect(work).toHaveBeenCalledTimes(1);
	release({ reset: true });
	await recovering;
	await a.lifecycle.run(work);
});

test('stop during recovery cancels without resetting; close suppresses observers', async () => {
	const a = fixture();
	a.recover.mockImplementation(options => new Promise((_resolve, reject) => {
		options[syncAbortSignalSymbol].addEventListener('abort', () => reject(options[syncAbortSignalSymbol].reason));
	}));
	const states = [];
	a.recovery.on(state => states.push(state));
	a.recovery.on(() => { throw new Error('view failed'); });
	const recovering = a.recovery.recover().catch(error => error);
	await vi.waitFor(() => expect(a.recover).toHaveBeenCalledTimes(1));
	await a.lifecycle.stop();
	expect((await recovering).code).toBe('ORANGE_SYNC_ABORT');
	expect(await a.recovery.getState()).toMatchObject({ blocked: true, recovering: false, resetCount: 0 });
	await a.lifecycle.close();
	const count = states.length;
	await expect(a.recovery.reset()).rejects.toThrow('closed');
	expect(states).toHaveLength(count);
});

test('a completed reset is never repeated on failed download or persistent mismatch, including explicit retry', async () => {
	const a = fixture();
	a.sync.mockRejectedValueOnce(new Error('offline'));
	await expect(a.recovery.recover({ synchronize: true })).rejects.toThrow('offline');
	expect(await a.recovery.getState()).toMatchObject({ blocked: true, resetCount: 1, discarded: 2 });
	a.sync.mockRejectedValue(Object.assign(new Error('mismatch'), { code: 'ORANGE_SYNC_SCHEMA_MISMATCH' }));
	for (let i = 0; i < 2; i++)
		await expect(a.recovery.recover({ synchronize: true })).rejects.toMatchObject({ code: 'ORANGE_SYNC_SCHEMA_RECOVERY_FAILED' });
	expect(a.recover).toHaveBeenCalledTimes(1);
	expect(a.reset).not.toHaveBeenCalled();
});

test('ordinary errors do not latch recovery and explicit destructive reset clears a failed drain', async () => {
	const a = fixture();
	await expect(a.lifecycle.run(() => { throw new Error('network'); })).rejects.toThrow('network');
	expect((await a.recovery.getState()).blocked).toBe(false);
	a.recover.mockRejectedValue(new Error('drain failed'));
	await expect(a.recovery.recover()).rejects.toThrow('drain failed');
	await a.recovery.reset();
	expect(await a.recovery.getState()).toMatchObject({ blocked: false, resetCount: 1 });
	expect(a.reset).toHaveBeenCalledTimes(1);
});


test('a later explicit stop remains paused across recovery and reset', async () => {
	const a = fixture();
	await a.recovery.recover();
	await a.lifecycle.run(async () => {});
	await a.lifecycle.stop();
	await a.recovery.reset();
	await expect(a.lifecycle.run(async () => {})).rejects.toMatchObject({ code: 'ORANGE_SYNC_ABORT' });
	await a.lifecycle.start(async () => {});
});


test('schema mismatch alone fences sync without authorizing any recovery or reset', async () => {
	const a = fixture();
	const mismatch = Object.assign(new Error('Old schema'), { code: 'ORANGE_SYNC_SCHEMA_MISMATCH' });
	await expect(a.lifecycle.run(() => { throw mismatch; })).rejects.toBe(mismatch);
	expect(await a.recovery.getState()).toMatchObject({ blocked: true, recovering: false, resetCount: 0, error: mismatch });
	await expect(a.lifecycle.start(async () => {})).rejects.toMatchObject({ code: 'ORANGE_SYNC_SCHEMA_RECOVERY_BLOCKED' });
	expect(a.recover).not.toHaveBeenCalled();
	expect(a.reset).not.toHaveBeenCalled();
	await a.recovery.reset();
	await a.lifecycle.run(async () => {});
});
