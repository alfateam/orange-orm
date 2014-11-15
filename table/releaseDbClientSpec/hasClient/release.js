function act(c){
	c.dbClientDone = c.mock();
	c.dbClientDone.expect();
	c.getSessionSingleton.expect('dbClientDone').return(c.dbClientDone);
	c.sut();
}

module.exports = act;