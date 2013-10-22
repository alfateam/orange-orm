var c = {};
var when = require('a').when;

when(c).
	it('should add formula discriminator1').assertEqual(c.discriminator1,c.sut._formulaDiscriminators[0]).
	it('should add formula discriminator2').assertEqual(c.discriminator2,c.sut._formulaDiscriminators[1]).
	it('should return sut').assertEqual(c.sut,c.returned);