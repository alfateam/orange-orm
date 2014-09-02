var a = require('a');
var mock = a.mock;

function act(c){
	c.mock = mock;
    c.requireMock = a.requireMock;
    c.then = a.then;
	c.table = {};
	c.initialDto = {};
    c.dto = {};
    c.mapFields = c.requireMock('./mapFields');
    c.newSingleRelatedToDto = c.requireMock('./newSingleRelatedToDto');
    c.newManyRelatedToDto = c.requireMock('./newManyRelatedToDto');
    c.promise = c.requireMock('../../promise');
    c.extractDto = c.requireMock('./newToDto/extractDto');
    c.resultToPromise = c.requireMock('../../resultToPromise');
    c.all = mock();
    c.promise.all = c.all;

    
    c.strategy = {
        customer: {},
        lines: {},
        bar: {}
    };


	c.sut = require('../newToDto')(c.strategy, c.table, c.initialDto);
}

module.exports = act;