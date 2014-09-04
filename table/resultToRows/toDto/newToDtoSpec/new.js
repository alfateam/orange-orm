var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.table = {};
	c.initialDto = {};
    c.dto = {};
    c.mapFields = requireMock('./mapFields');
    c.newSingleRelatedToDto = requireMock('./newSingleRelatedToDto');
    c.newManyRelatedToDto = requireMock('./newManyRelatedToDto');
    c.promise = requireMock('../../promise');
    c.extractDto = requireMock('./newToDto/extractDto');
    c.resultToPromise = requireMock('../../resultToPromise');
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