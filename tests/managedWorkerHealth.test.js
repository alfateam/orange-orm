import { afterEach, expect, test, vi } from 'vitest';
const createClient = require('../src/client/syncWorkerClient');
const responder = require('../src/client/managedSyncHealthResponder');
const inlineSqlWorker = require('../src/sqliteOPFS/inlineWorker');

const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); vi.useRealTimers(); });
function fixture(config = {}) {
	vi.useFakeTimers();
	let visible = true;
	const listeners = new Set();
	const visibility = { isVisible: () => visible, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
	class Worker extends EventTarget {
		messages = []; terminated = 0;
		postMessage(message) { this.messages.push(message); }
		terminate() { this.terminated++; }
		reply(data) { this.dispatchEvent(new MessageEvent('message', { data })); }
	}
	const worker = new Worker(), onTerminal = vi.fn();
	const client = createClient(worker, { closeTimeoutMs: 100, visibility, onTerminal,
		__managedHealth: { healthCheck: { intervalMs: 100, timeoutMs: 100 }, visibility }, ...config });
	cleanup.push(async () => { const close = client.close().catch(() => {}); await vi.advanceTimersByTimeAsync(1000); await close; });
	return { worker, client, onTerminal, visibility, setVisible(value) { visible = value; for (const fn of [...listeners]) fn(value); } };
}

test('silent transport rejects every pending call, fences late replies and terminates once', async () => {
	const { client, worker, onTerminal } = fixture();
	const events = [];
	client.on('sync', event => events.push(event));
	const pending = Promise.all([client.sync(), client.getSchemaRecoveryState()].map(p => p.catch(e => e)));
	await vi.advanceTimersByTimeAsync(102);
	for (const error of await pending) expect(error.code).toBe('ORANGE_WORKER_UNRESPONSIVE');
	expect(worker.terminated).toBe(1);
	expect(onTerminal).toHaveBeenCalledTimes(1);
	worker.reply({ type: 'orange-sync-worker-event', event: 'sync', payload: {} });
	expect(events).toEqual([]);
	await expect(client.sync()).rejects.toMatchObject({ code: 'ORANGE_WORKER_UNRESPONSIVE' });
	await expect(client.close()).rejects.toMatchObject({ code: 'ORANGE_WORKER_UNRESPONSIVE' });
	expect(worker.terminated).toBe(1);
});

test('hidden time does not kill a healthy worker; resume requires a fresh probe on the same worker', async () => {
	const f = fixture();
	await vi.advanceTimersByTimeAsync(1);
	const old = f.worker.messages.at(-1);
	f.setVisible(false);
	await vi.advanceTimersByTimeAsync(3600000);
	expect(f.worker.terminated).toBe(0);
	f.setVisible(true);
	const fresh = f.worker.messages.at(-1);
	expect(fresh.id).not.toBe(old.id);
	f.worker.reply({ type: 'orange-managed-sync-health-response', id: old.id });
	await vi.advanceTimersByTimeAsync(50);
	f.worker.reply({ type: 'orange-managed-sync-health-response', id: fresh.id });
	await vi.advanceTimersByTimeAsync(60);
	expect(f.worker.terminated).toBe(0);
	expect(f.onTerminal).not.toHaveBeenCalled();
});

test('scheduler suspension without a visibility event grants a fresh reply deadline', async () => {
	const { worker } = fixture();
	await vi.advanceTimersByTimeAsync(1);
	vi.setSystemTime(Date.now() + 3600000);
	await vi.advanceTimersByTimeAsync(100);
	expect(worker.terminated).toBe(0);
	worker.reply({ type: 'orange-managed-sync-health-response', id: worker.messages.at(-1).id });
	await vi.advanceTimersByTimeAsync(99);
	expect(worker.terminated).toBe(0);
});

test('close has its own foreground deadline even when health checks are disabled', async () => {
	const f = fixture({ __managedHealth: { healthCheck: false } });
	const syncing = f.client.sync().catch(e => e);
	const closing = f.client.close().catch(e => e);
	f.setVisible(false);
	await vi.advanceTimersByTimeAsync(10000);
	expect(f.worker.terminated).toBe(0);
	f.setVisible(true);
	await vi.advanceTimersByTimeAsync(101);
	expect((await syncing).message).toContain('closed');
	expect((await closing).code).toBe('ORANGE_WORKER_CLOSE_TIMEOUT');
	expect(f.worker.terminated).toBe(1);
});

test('probe completion requires every SQL port, ignores stale replies and does not need SQL checkout', async () => {
	const channels = [new MessageChannel(), new MessageChannel()];
	cleanup.push(() => channels.forEach(c => { c.port1.close(); c.port2.close(); }));
	const replies = [];
	const handle = responder(channels.map(c => c.port1), message => replies.push(message));
	const request = { type: 'orange-managed-sync-health-request', id: 1 };
	handle(request);
	channels[0].port2.postMessage({ type: 'orange-sqlite-health-response', id: 1 });
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(replies).toEqual([]);
	handle({ ...request, id: 2 });
	channels[1].port2.postMessage({ type: 'orange-sqlite-health-response', id: 1 });
	channels[1].port2.postMessage({ type: 'orange-sqlite-health-response', id: 2 });
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(replies).toEqual([]);
	channels[0].port2.postMessage({ type: 'orange-sqlite-health-response', id: 2 });
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(replies).toEqual([{ type: 'orange-managed-sync-health-response', id: 2 }]);
});

test('inline SQL transport replies to health probes without opening SQLite or acquiring a checkout', async () => {
	const worker = inlineSqlWorker({ sqliteModuleUrl: 'not-a-real-sqlite-module' });
	const channel = new MessageChannel();
	cleanup.push(() => { channel.port1.close(); channel.port2.close(); worker.terminate(); });
	worker.postMessage({ type: 'orange-sqlite-opfs-connect' }, [channel.port1]);
	const replies = [];
	const handle = responder([channel.port2], message => replies.push(message));
	handle({ type: 'orange-managed-sync-health-request', id: 1 });
	await vi.waitFor(() => expect(replies).toEqual([{ type: 'orange-managed-sync-health-response', id: 1 }]));
});
