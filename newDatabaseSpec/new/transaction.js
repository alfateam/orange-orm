function act(c){
	c.resolveTransaction = {};
	c.domain = {};
	c.Domain.create.expect().return(c.domain);
	c.newTransaction.expect(c.domain, c.connectionString).return(c.resolveTransaction);
	c.newPromise.expect(c.resolveTransaction).return(c.expected);
	c.returned = c.sut.transaction();
}

module.exports = act;