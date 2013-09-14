var mock = require('a').mock;

function act(c) {

	c.returned = c.sut.parameters();
}
act.base = '../new'
module.exports  = act;