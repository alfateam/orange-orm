var mock =require('a').mock;

function act(c){
	c.table = {};
	c.id = {};
	c.id2 = {};
	c.strategy = {};
	
	c.pk1 = {};
	c.pk1.alias = 'pk1Alias';

	c.pk2 = {};
	c.pk2.alias = 'pk2Alias';

	c.table._primaryColumns = [c.pk1, c.pk2];

	c.cache = {};
	c.cache.tryGet = mock();
	c.key = {};
	c.key.pk1Alias = c.id;
	c.key.pk2Alias = c.id2;
	c.cache.tryGet.expect(c.key).return(c.expected);
	c.table._cache = c.cache;

	c.sut = require('../tryGetFromCacheById');
	c.returned = c.sut(c.table, c.id, c.id2, c.strategy);
}

module.exports = act;