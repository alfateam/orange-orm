var a = require('a');

function act(c){
	c.returned = require('../negotiateLimit')(undefined);
}

module.exports = act;