var c = {};
var when = require('a').when;

when(c).	
	it('should add column discriminator').assertEqual(c.discriminator,c.sut.columnDiscriminators[0]).
	it('should return sut').assertEqual(c.sut,c.returned);