var q1 = {};
var q2 = {};
var queries = [q1,q2];
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;

function act(c){
	c.executeQueriesCore = requireMock('./executeQueries/executeQueriesCore');
	c.executeChanges = requireMock('./executeQueries/executeChanges');
	c.popChanges = requireMock('./popChanges');
	c.newParameterized = requireMock('./query/newParameterized');

	c.sut = require('../executeQueries');
}


module.exports = act;