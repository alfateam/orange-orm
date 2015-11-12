function act(c){
	c.onSuccess.expect();
	c.client = {};
	c.done = {};

	c.wrappedQuery = {};
	c.wrapQuery.expect(c.client).return(c.wrappedQuery);

	c.wrappedQueryStream = {};
	c.wrapQueryStream.expect(c.client).return(c.wrappedQueryStream);

	c.raiseConnected(null, c.client, c.done);
}

module.exports = act;