function act(c){	
	c.filter2.sql.expect().return(null);	
	c.returned = c.sut(c.filter, c.filter2);
}

module.exports = act;