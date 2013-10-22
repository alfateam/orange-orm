var discriminator1 = {};
var discriminator2 = {};

function act(c) {
	c.discriminator1 = discriminator1;
	c.discriminator2 = discriminator2;
	c.returned = c.sut.columnDiscriminators(discriminator1, discriminator2);
}

act.base = '../new';
module.exports = act;