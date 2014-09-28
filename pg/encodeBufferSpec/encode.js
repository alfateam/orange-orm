var a = require('a');

function act(c){
	c.buffer = new Buffer( [1,2,3] );
	c.expected = "E'\\\\x" + c.buffer.toString('hex') + "'";
	c.sut = require('../encodeBuffer');
	c.returned = c.sut(c.buffer);
}

module.exports = act;