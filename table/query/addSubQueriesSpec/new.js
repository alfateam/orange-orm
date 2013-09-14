var requireMock = require('a').requireMock;
var manyLegToQuery = requireMock('./addSubQueries/manyLegToQuery');

function act(c) {
	c.manyLegToQuery = manyLegToQuery;
	c.sut = require('../addSubQueries');
}

module.exports = act;

