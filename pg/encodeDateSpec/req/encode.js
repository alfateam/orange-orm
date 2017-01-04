function act(c){
	c.date = new Date();
	c.expected = "'" + c.date.toISOString() + "'";
	
	c.returned = c.sut(c.date);
}

module.exports = act;