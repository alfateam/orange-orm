var mock = require('a').mock;
var table = {};
var filter = {};
var alias = {};

function act(c) {
	filter.isEmpty = mock();
	filter.isEmpty.expect().return(false);
	filter.sql = mock();
	filter.sql.expect().return('some filter');
	c.newDiscriminatorSql.expect(table, alias).return(' some discriminator');
	c.expected = ' where some filter AND some discriminator';
	c.returned = c.sut(table, filter, alias);
}
act.base = '../../require';
module.exports = act;