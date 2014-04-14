function act(c){
	c.lastCommandMatches.expect(c.row).return(true);
	c.sut(c.table, c.column, c.row);
}

module.exports = act;