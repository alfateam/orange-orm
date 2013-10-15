function act(c) {
	c.alias;
	c.sut = require('../../extractAlias');
	c.returned = c.sut(c.alias);
}

module.exports = act;