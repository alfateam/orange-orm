var requireMock = require('a_mock').requireMock;
var getMany = requireMock('./getMany');

var table = 't';
var filter = 'f';
var strategy = 's';

function act(c) {
	c.sut = require('../tryGetFirstFromDb');
	c.get = get;
	c.table = table;
	c.getMany = getMany;
	c.strategy = strategy;
	c.filter = filter;
		
	function get() {
		c.returned = c.sut(table,filter,strategy);
	}
}


module.exports = act;