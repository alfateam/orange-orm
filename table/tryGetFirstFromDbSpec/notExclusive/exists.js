function act(c) {	
	c.row1 = {};
	c.row2 = {};
	c.rows = [c.row1,c.row2];
	
	c.getMany.expect(c.table,c.filter,c.strategy).resolve(c.rows);

	return  c.sut(c.table,c.filter,c.initialStrategy).then(function(returned) {
		c.returned = returned;
	});
}

module.exports = act;