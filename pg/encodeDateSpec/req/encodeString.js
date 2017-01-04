function act(c){
	c.date = new Date();
	c.dateText = c.date.toISOString();
	c.expected = "'" + c.dateText + "'";
	
	c.returned = c.sut(c.dateText);
}

module.exports = act;