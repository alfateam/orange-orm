var a = require('a');

function act(c) {
	c.Domain.create = c.mock();

	c.newDomain = {};
	c.Domain.create.expect().return(c.newDomain);

	c.stubDomainExit();

	c.returned = c.sut();
}

module.exports = act;