import { describe, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const queuePath = fileURLToPath(new URL('../src/hostExpress/createQueue.js', import.meta.url));

describe('Express sync queue', () => {
	test('releases completed jobs and their captured request state', () => {
		const script = `
			const assert = require('node:assert/strict');
			const createQueue = require(process.argv[1]);
			async function run() {
				const queue = createQueue({ concurrency: 1, maxPending: 1 });
				let completed = 0;
				async function enqueue() {
					const requestState = { body: Buffer.alloc(1024 * 1024) };
					const ref = new WeakRef(requestState);
					const job = () => { const retained = requestState; return retained.body.byteLength; };
					assert.equal(await queue.run(job), 1024 * 1024);
					completed++;
					return ref;
				}
				const refs = [];
				for (let i = 0; i < 24; i++) refs.push(await enqueue());
				for (let i = 0; i < 8; i++) {
					global.gc();
					await new Promise(resolve => setImmediate(resolve));
				}
				assert.equal(completed, 24);
				assert.equal(refs.filter(ref => ref.deref() !== undefined).length, 0,
					'completed queue entries must not retain their request state');
			}
		run().catch(error => { console.error(error); process.exitCode = 1; });
		`;
		execFileSync(process.execPath, ['--expose-gc', '-e', script, queuePath], { stdio: 'pipe' });
	});
});
