var mock = require('a_mock').mock;

function act(c) {

	c.returned = c.sut.parameters();
}
act.base = '../new'
module.exports  = act;