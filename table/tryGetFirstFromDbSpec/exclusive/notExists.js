function act(c) {	
	c.getMany.exclusive.expect(c.table,c.filter,c.strategy).resolve([]);

	return  c.sut.exclusive(c.table,c.filter,c.initialStrategy).then(function(returned) {
		c.returned = returned;
	});
}

module.exports = act;