var c = {};
var when = require('a').when;

when(c).	
	it('should add column discriminator1').assertEqual(c.discriminator1,c.sut._columnDiscriminators[0]).
	it('should add column discriminator2').assertEqual(c.discriminator2,c.sut._columnDiscriminators[1]).
	it('should return sut').assertEqual(c.sut,c.returned);