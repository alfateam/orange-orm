function act(c) {	
	c.getMany.expect(c.table,c.filter,c.strategy).resolve([]);

	return  c.sut(c.table,c.filter,c.initialStrategy).then(function(returned) {
		c.returned = returned;
	});
}

module.exports = act;