function act(c){
	c.onSuccess.expect();
	c.connection = {};	
	
	c.connection.release = {};
	c.connection.release.bind = c.mock();
	c.boundRelease = {};
	c.connection.release.bind.expect(c.connection).return(c.boundRelease);	
	
	c.connection.escape = {};
	c.connection.escape.bind = c.mock();
	c.boundEscape = {};
	c.connection.escape.bind.expect(c.connection).return(c.boundEscape);

	c.wrappedQuery = {};
	c.wrapQuery.expect(c.connection).return(c.wrappedQuery);

	c.raiseConnected(null, c.connection, c.release);
}

module.exports = act;