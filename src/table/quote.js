let tryGetSessionContext = require('./tryGetSessionContext');

function quote(context, name) {
	let rdb = tryGetSessionContext(context);
	if (!rdb)
		throw new Error('Rdb transaction is no longer available. Is promise chain broken ?');
	let fn = rdb.quote || (() => `"${name}"`);
	return fn(name);
}

module.exports = quote;