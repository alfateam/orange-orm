function act(c) {	
	c.table = 't';
	c.filter = 'f';
	c.strategy = 's';

	c.getMany.exclusive.expect(c.table,c.filter,c.strategy).resolve([]);

	return  c.sut.exclusive(c.table,c.filter,c.strategy).then(function(returned) {
		c.returned = returned;
	});
}

module.exports = act;