var when = require('a').when;
var c = {};

when(c)
	.it('getAll points to domainCache.getAll ').assertEqual(c.domainCache.getAll, c.sut.getAll)
	.it('should set subscribeAdded point to domainCache.subscribeAdded').assertEqual(c.domainCache.subscribeAdded, c.sut.subscribeAdded)
	.it('should set subscribeRemoved point to domainCache.subscribeRemoved').assertEqual(c.domainCache.subscribeRemoved, c.sut.subscribeRemoved)
	;
