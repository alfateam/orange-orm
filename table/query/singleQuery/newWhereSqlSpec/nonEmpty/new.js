var mock = require('a').mock;
var filter = {};

function act(c) {
	filter.isEmpty = mock();
	filter.isEmpty.expect().return(true);
	c.returned = c.sut(filter);
}
act.base = '../require';
module.exports = act;