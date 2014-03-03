var requireMock = require('a').requireMock;

function toPromise(c) {
	c.result = {};
	c.callback = {};
	
	c.promise = {};
	c.newPromise  = requireMock('./promise');
	c.newPromise.expect(c.callback).return(c.promise);
		
	c.objectToCallback  = requireMock('./objectToCallback');
	c.objectToCallback.expect(c.result).return(c.callback);
	
	c.returned = require('../resultToPromise')(c.result);

}

module.exports = toPromise;