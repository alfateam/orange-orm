const getSessionContext = require('./getSessionContext');

function setSessionSingleton(context, name, value) {
	const rdb = getSessionContext(context);
	rdb[name] = value;
}

module.exports = setSessionSingleton;