var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.pushCommand = c.requireMock('./commands/pushCommand');
	c.newDeleteCommand = c.requireMock('./commands/newDeleteCommand');
	c.extractDeleteStrategy = c.requireMock('./extractDeleteStrategy');
	c.resultToPromise = c.requireMock('./resultToPromise');
	c.emptyPromise = {};
	c.resultToPromise.expect().return(c.emptyPromise);

	c.sut = require('../delete')
}

module.exports = act;