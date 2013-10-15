var c = {};
var when = require('a').when;

when(c).
	it('should add formula discriminator').assertEqual(c.discriminator,c.sut.formulaDiscriminators[0]).
	it('should return sut').assertEqual(c.sut,c.returned);