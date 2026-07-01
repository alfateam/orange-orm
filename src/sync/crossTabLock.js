const randomUuid = require('../randomUuid');

async function runWithCrossTabLock(name, config, fn) {
	const lockConfig = config || { enabled: true };
	if (!lockConfig.enabled)
		return fn();
	const locks = getWebLocks();
	if (locks)
		return runWithWebLock(locks, name, lockConfig, fn);
	const storage = getLocalStorage();
	if (storage)
		return runWithLocalStorageLock(storage, name, lockConfig, fn);
	return fn();
}

async function acquireCrossTabLock(name, config) {
	const lockConfig = config || { enabled: true };
	if (!lockConfig.enabled)
		return noop;

	let releaseHold;
	const hold = new Promise((resolve) => {
		releaseHold = resolve;
	});
	let resolveAcquired;
	let rejectAcquired;
	const acquired = new Promise((resolve, reject) => {
		resolveAcquired = resolve;
		rejectAcquired = reject;
	});
	const request = runWithCrossTabLock(name, {
		...lockConfig,
		releaseOnPageHide: false
	}, async () => {
		resolveAcquired();
		await hold;
	});
	request.catch(rejectAcquired);
	await acquired;

	let released = false;
	return function releaseCrossTabLock() {
		if (released)
			return;
		released = true;
		releaseHold();
		request.catch(() => {});
	};
}

function normalizeCrossTabLockConfig(value) {
	if (value === false)
		return { enabled: false };
	if (value === true || value === undefined || value === null)
		return { enabled: true };
	if (typeof value === 'string')
		return { enabled: true, name: value };
	if (value !== Object(value))
		throw new Error('Invalid sqlite sync crossTabLock configuration');
	return {
		enabled: value.enabled !== false,
		name: typeof value.name === 'string' && value.name.length > 0 ? value.name : undefined,
		timeoutMs: normalizePositiveInteger(value.timeoutMs),
		maxHoldMs: normalizePositiveInteger(value.maxHoldMs),
		staleMs: normalizePositiveInteger(value.staleMs),
		pollMs: normalizePositiveInteger(value.pollMs)
	};
}

function getWebLocks() {
	const nav = typeof globalThis !== 'undefined' ? globalThis.navigator : undefined;
	return nav && nav.locks && typeof nav.locks.request === 'function'
		? nav.locks
		: null;
}

async function runWithWebLock(locks, name, config, fn) {
	const options = { mode: 'exclusive' };
	const timeoutMs = config.timeoutMs;
	let timeoutId;
	let waiting = true;
	let timedOut = false;
	if (timeoutMs && typeof AbortController === 'function') {
		const controller = new AbortController();
		options.signal = controller.signal;
		timeoutId = setTimeout(() => {
			if (!waiting)
				return;
			timedOut = true;
			controller.abort();
		}, timeoutMs);
	}
	try {
		return await locks.request(name, options, async () => {
			waiting = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			return runLockBody(name, config, fn);
		});
	}
	catch (e) {
		if (timedOut || e && e.name === 'AbortError')
			throw lockTimeoutError(name, timeoutMs, config);
		throw e;
	}
	finally {
		if (timeoutId)
			clearTimeout(timeoutId);
	}
}

function getLocalStorage() {
	if (typeof globalThis === 'undefined' || !globalThis.localStorage)
		return null;
	try {
		const key = 'orange-orm:sync-lock-probe';
		globalThis.localStorage.setItem(key, '1');
		globalThis.localStorage.removeItem(key);
		return globalThis.localStorage;
	}
	catch (_e) {
		return null;
	}
}

async function runWithLocalStorageLock(storage, name, config, fn) {
	const lock = await acquireLocalStorageLock(storage, name, config);
	const renewIntervalMs = Math.max(250, Math.floor(lock.staleMs / 3));
	const intervalId = setInterval(() => {
		try {
			renewLocalStorageLock(storage, lock);
		}
		catch (_e) {
			// A failed renewal will let another tab take the lock after staleMs.
		}
	}, renewIntervalMs);
	try {
		return await runLockBody(name, config, fn);
	}
	finally {
		clearInterval(intervalId);
		releaseLocalStorageLock(storage, lock);
	}
}

async function runLockBody(name, config, fn) {
	const operation = Promise.resolve().then(fn);
	operation.catch(() => {});
	const races = [operation];
	const cleanup = [];
	const maxHoldMs = normalizePositiveInteger(config && config.maxHoldMs);
	if (maxHoldMs) {
		races.push(new Promise((_resolve, reject) => {
			const timeoutId = setTimeout(() => reject(lockHoldTimeoutError(name, maxHoldMs, config)), maxHoldMs);
			cleanup.push(() => clearTimeout(timeoutId));
		}));
	}
	if (!config || config.releaseOnPageHide !== false) {
		const pageHide = createPageHideLockRelease(name, config);
		if (pageHide) {
			races.push(pageHide.promise);
			cleanup.push(pageHide.cleanup);
		}
	}
	try {
		return await Promise.race(races);
	}
	finally {
		for (let i = 0; i < cleanup.length; i++)
			cleanup[i]();
	}
}

function createPageHideLockRelease(name, config) {
	const target = typeof globalThis !== 'undefined' ? globalThis : undefined;
	if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function')
		return null;
	let cleanup = () => {};
	const promise = new Promise((_resolve, reject) => {
		const release = () => reject(lockPageHiddenError(name, config));
		target.addEventListener('pagehide', release, { once: true });
		cleanup = () => target.removeEventListener('pagehide', release);
	});
	return { promise, cleanup };
}

async function acquireLocalStorageLock(storage, name, config) {
	const key = `orange-orm:sync-lock:${name}`;
	const owner = randomUuid();
	const staleMs = config.staleMs || 60000;
	const pollMs = config.pollMs || 100;
	const startedAt = Date.now();
	for (;;) {
		const now = Date.now();
		const current = readLocalStorageLock(storage, key);
		if (!current || current.expiresAt <= now || current.owner === owner) {
			writeLocalStorageLock(storage, key, { owner, expiresAt: now + staleMs });
			const next = readLocalStorageLock(storage, key);
			if (next && next.owner === owner)
				return { key, owner, staleMs };
		}
		if (config.timeoutMs && now - startedAt >= config.timeoutMs)
			throw lockTimeoutError(name, config.timeoutMs, config);
		await delay(pollMs);
	}
}

function renewLocalStorageLock(storage, lock) {
	const current = readLocalStorageLock(storage, lock.key);
	if (!current || current.owner !== lock.owner)
		return;
	writeLocalStorageLock(storage, lock.key, {
		owner: lock.owner,
		expiresAt: Date.now() + lock.staleMs
	});
}

function releaseLocalStorageLock(storage, lock) {
	try {
		const current = readLocalStorageLock(storage, lock.key);
		if (current && current.owner === lock.owner)
			storage.removeItem(lock.key);
	}
	catch (_e) {
		// Releasing a best-effort browser lock should not hide the result.
	}
}

function readLocalStorageLock(storage, key) {
	const raw = storage.getItem(key);
	if (!raw)
		return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed.owner !== 'string')
			return null;
		const expiresAt = Number(parsed.expiresAt);
		return Number.isFinite(expiresAt) ? { owner: parsed.owner, expiresAt } : null;
	}
	catch (_e) {
		return null;
	}
}

function writeLocalStorageLock(storage, key, value) {
	storage.setItem(key, JSON.stringify(value));
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function lockTimeoutError(name, timeoutMs, config) {
	return new Error(`Timed out waiting for ${lockLabel(config)} "${name}" after ${Math.round((timeoutMs || 0) / 1000)} seconds.`);
}

function lockHoldTimeoutError(name, timeoutMs, config) {
	return new Error(`Timed out while holding ${lockLabel(config)} "${name}" after ${Math.round((timeoutMs || 0) / 1000)} seconds.`);
}

function lockPageHiddenError(name, config) {
	return new Error(`Released ${lockLabel(config)} "${name}" because the page was hidden.`);
}

function lockLabel(config) {
	return config && typeof config.label === 'string' && config.label.length > 0
		? config.label
		: 'sync lock';
}

function normalizePositiveInteger(value) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeLockNamePart(value) {
	return String(value).replace(/\s+/g, ' ').trim() || 'default';
}

function noop() {}

module.exports = {
	acquireCrossTabLock,
	normalizeCrossTabLockConfig,
	normalizeLockNamePart,
	normalizePositiveInteger,
	runWithCrossTabLock
};
