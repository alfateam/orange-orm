function createQueue({ concurrency, maxPending }) {
	let running = 0;
	const pending = [];
	let pendingHead = 0;
	return { run };

	function run(job) {
		return new Promise((resolve, reject) => {
			if (running >= concurrency && pending.length - pendingHead >= maxPending) {
				const error = new Error('Sync queue is full. Try again later.');
				error.status = 429;
				reject(error);
				return;
			}
			pending.push({ job, resolve, reject });
			drain();
		});
	}

	function drain() {
		while (running < concurrency && pendingHead < pending.length) {
			const next = pending[pendingHead];
			// The active promise chain owns `next` until the job settles.
			// Drop the queue's reference so completed jobs and results can be collected.
			pending[pendingHead] = undefined;
			pendingHead += 1;
			if (pendingHead > 1024 && pendingHead * 2 > pending.length) {
				pending.splice(0, pendingHead);
				pendingHead = 0;
			}
			running += 1;
			Promise.resolve()
				.then(next.job)
				.then(next.resolve, next.reject)
				.finally(() => {
					running -= 1;
					drain();
				});
		}
	}
}

module.exports = createQueue;
