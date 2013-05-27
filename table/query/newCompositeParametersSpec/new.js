var a = require('a_mock');
var requireMock = a.requireMock;
var mock = a.mock;
var newCollection = requireMock('../../newCollection');
var collection = {};

function act(c) {
	c.requireMock = requireMock;
	c.mock = mock;	
	newCollection.expect().return(collection);
	c.collection = collection;
	c.sut = require('../newCompositeParameters')();
}

module.exports = act;