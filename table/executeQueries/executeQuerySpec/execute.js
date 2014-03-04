var a = require('a');
var requireMock = a.requireMock;
var newPromise = requireMock('../promise');
var newResolveExecuteQuery = requireMock('./resolveExecuteQuery');
var query = {};
var resolver = {};
var expected = {};

function act(c){
	newResolveExecuteQuery.expect(query).return(resolver);
	newPromise.expect(resolver).return(expected);
	c.expected = expected;
	c.returned = require('../executeQuery')(query);
}

module.exports = act;