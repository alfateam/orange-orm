function act(c){
	c.sut = require('../newObject');
	c.returned = c.sut();
}

module.exports = act;