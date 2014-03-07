var sut = require('../negotiateDefault');

function act(c){
	c.column = {};
	c.sut = sut;
}

module.exports = act;