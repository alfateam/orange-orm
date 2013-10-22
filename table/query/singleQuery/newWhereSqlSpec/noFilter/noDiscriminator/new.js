var mock = require('a').mock;
var table = {};
var filter = {};
var alias = {};

function act(c) {
	filter.sql = mock();
	filter.sql.expect().return('');
	c.newDiscriminatorSql.expect(table, alias).return('');
	c.returned = c.sut(table, filter, alias);
}
act.base = '../../require';
module.exports = act;