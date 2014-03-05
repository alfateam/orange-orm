function act(c){
	c.rows = {};
	c.result = {};	
	c.resultToRows.expect(c.span,c.result).return(c.rows);
	c.returned = c.resolve(c.result);
}

module.exports = act;