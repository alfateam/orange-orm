var discriminator = {};

function act(c) {
	c.discriminator = discriminator;
	c.returned = c.sut.columnDiscriminator(discriminator);
}

act.base = '../new';
module.exports = act;