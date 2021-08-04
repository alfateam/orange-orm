function act(c){
	c.row = {
		a: 1,
		b: 5,
		c: {}
	};

	c.row2 = {
		a: 1,
		b: 10,
		c: {}
	};

	c.row3 = {
		a: 10,
		b: 0,
		c: 'b',
	};

	c.row4 = {
		a: 10,
		b: 0,
		c: undefined
	};

	c.rows = [c.row, c.row2, c.row3, c.row4];

	c.expected = [c.row2, c.row, c.row4, c.row3];
	c.strategy = {
		orderBy: ['a', 'b desc', 'c asc']
	};

	c.returned = c.sut(c.strategy, c.rows);
}

module.exports = act;