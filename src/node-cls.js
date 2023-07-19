const async_hooks = require('async_hooks');
const store = new Map();

function createContext(data) {
	const asyncResource = new async_hooks.AsyncResource('CREATE_CONTEXT');
	asyncResource.runInAsyncScope(() => {
		const eid = async_hooks.executionAsyncId();
		store.set(eid, data);
	});
	return asyncResource;
}

function getContext() {
	const eid = async_hooks.executionAsyncId();
	return store.get(eid);
}

async_hooks.createHook({
	init(asyncId, type, triggerAsyncId) {
		const triggerContext = store.get(triggerAsyncId);
		if (triggerContext) {
			store.set(asyncId, triggerContext);
		}
	},
	destroy(asyncId) {
		store.delete(asyncId);
	},
}).enable();

function create() {
	const data = {};
	const asyncResource = createContext(data);

	function run(fn) {
		return asyncResource.runInAsyncScope(fn, this, data);
	}

	function bind(fn) {
		return (...args) => {
			return asyncResource.runInAsyncScope(fn, this, ...args);
		};
	}

	data.run = run;
	data.bind = bind;
	return data;
}

module.exports = {
	get: getContext,
	getContext: getContext,
	create,
};
