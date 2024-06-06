let tryGetSessionContext = require('./tryGetSessionContext');

function quote(name) {
	let context = tryGetSessionContext();
	if (!context)
		throw new Error('Rdb transaction is no longer available. Is promise chain broken ?');
	let fn = context.quote || (() => `"${name}"`);
	return fn(name);
}

module.exports = quote;