var mock = require('a').mock;
var filter = {};

function act(c) {
	filter.sql = mock();
	filter.sql.expect().return('');
	c.returned = c.sut(filter);
}
act.base = '../require';
module.exports = act;