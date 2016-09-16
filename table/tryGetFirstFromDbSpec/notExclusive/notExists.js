function act(c) {	
	c.table = 't';
	c.filter = 'f';
	c.strategy = 's';

	c.getMany.expect(c.table,c.filter,c.strategy).resolve([]);

	return  c.sut(c.table,c.filter,c.strategy).then(function(returned) {
		c.returned = returned;
	});
}

module.exports = act;