function act(c) {
	c.sut = require('../../extractAlias');
	c.table = {
		_dbName: {}
	}
	c.returned = c.sut(c.table, undefined);
}

module.exports = act;