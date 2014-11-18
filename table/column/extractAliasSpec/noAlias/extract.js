function act(c) {
	c.sut = require('../../extractAlias');
	c.returned = c.sut(undefined);
}

module.exports = act;