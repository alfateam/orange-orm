function act(c){
	
	c.domain.dbClientDone = c.mock();
	c.domain.dbClientDone.expect();
	c.sut();
}

module.exports = act;