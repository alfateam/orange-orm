function act(c){
	c.onSuccess.expect();
	c.connection = {};	
	c.release = {};
	c.connection.release = c.release;
	c.connection.escape = {};
	c.connection.escape.bind = c.mock();
	c.boundEscape = {};
	c.connection.escape.bind.expect(c.connection).return(c.boundEscape);

	c.wrappedQuery = {};
	c.wrapQuery.expect(c.connection).return(c.wrappedQuery);

	c.raiseConnected(null, c.connection, c.release);
}

module.exports = act;