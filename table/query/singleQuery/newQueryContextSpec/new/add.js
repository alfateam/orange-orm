function act(c){
	c.row = {};
	
	c.rows.add = c.mock();
	c.rows.add.expect(c.row);
	
	c.sut.add(c.row);
}

module.exports = act;