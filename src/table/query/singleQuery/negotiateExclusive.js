var getSessionSingleton = require('../../getSessionSingleton');

function negotiateExclusive(table, alias, _exclusive) {
	if (table._exclusive || _exclusive) {
		var encode =  getSessionSingleton('selectForUpdateSql');
		return encode(alias);
	}
	return '';
}

module.exports = negotiateExclusive;