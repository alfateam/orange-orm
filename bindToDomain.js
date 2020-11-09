let useHook = require('./useHook');
let AsyncResource = useHook && require('async_hooks').AsyncResource;

function bindToDomain(callback) {
	if (AsyncResource.bind && AsyncResource.bind !== Function.prototype.bind)
		callback = bindWorkAround(callback);
	if (process.domain)
		callback = process.domain.bind(callback);
	return callback;

}

function bindWorkAround(cb) {
	AsyncResource.bind(invokeOriginal);
	let _arguments;
	return onData;

	function onData() {
		_arguments = arguments;
		invokeOriginal();
	}

	function invokeOriginal() {
		cb.apply(null, _arguments);
	}

}

module.exports = bindToDomain;