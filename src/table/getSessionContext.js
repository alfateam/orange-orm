let tryGetSessionContext = require('./tryGetSessionContext');

function getSessionContext(context) {
	const rdb = tryGetSessionContext(context);
	if (!rdb)
		throw new Error('Rdb transaction is no longer available. Is promise chain broken ?');
	return rdb;
}

module.exports = getSessionContext;