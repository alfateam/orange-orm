var getSessionSingleton = require('../../getSessionSingleton');

function negotiateExclusive(context, table, alias, _exclusive) {
	if (table._exclusive || _exclusive) {
		var encode =  getSessionSingleton(context, 'selectForUpdateSql');
		return encode(context, alias);
	}
	return '';
}

module.exports = negotiateExclusive;