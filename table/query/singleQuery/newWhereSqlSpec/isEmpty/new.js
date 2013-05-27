var mock = require('a_mock').mock;
var filter = {};

function act(c) {
	filter.isEmpty = mock();
	filter.isEmpty.expect().return(false);
	filter.sql = mock();
	filter.sql.expect().return('some filter');
	c.expected = 'where some filter';
	c.returned = c.sut(filter);
}
act.base = '../require';
module.exports = act;