var when = require('a').when;
var c = {};

when(c).
	it('should return equalFilter').assertEqual(c.equalFilter,c.returnedEqualFilter).
	it('should return betweenFilter').assertEqual(c.betweenFilter,c.returnedBetweenFilter);
