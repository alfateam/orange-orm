var discriminator = {};

function act(c) {
	c.discriminator = discriminator;
	c.returned = c.sut.formulaDiscriminator(discriminator);
}

act.base = '../new';
module.exports = act;