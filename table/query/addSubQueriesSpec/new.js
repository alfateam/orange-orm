var requireMock = require('a_mock').requireMock;
var manyLegToQuery = requireMock('./addSubQueries/manyLegToQuery');

function act(c) {
	c.manyLegToQuery = manyLegToQuery;
	c.sut = require('../addSubQueries');
}

module.exports = act;

