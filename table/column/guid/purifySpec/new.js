var a = require('a');
var mock = a.mock;

function act(c){
	c.sut = require('../purify');
}

module.exports = act;