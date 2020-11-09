let useHook = require('./useHook');
let AsyncResource = useHook && require('async_hooks').AsyncResource;
function bindToDomain(callback) {
	if (process.domain)
		callback = process.domain.bind(callback);
	if (AsyncResource.bind) {
		callback = AsyncResource.bind(callback);
	}
	return callback;

}

module.exports = bindToDomain;