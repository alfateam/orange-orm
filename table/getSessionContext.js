let tryGetSessionContext = require('./tryGetSessionContext');

function getSessionContext() {
	let context = tryGetSessionContext();
	if (!context)
		throw new Error('Rdb transaction is no longer available. Is promise chain broken ?');
	return context;
}

module.exports = getSessionContext;