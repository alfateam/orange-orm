function act(c){
	c.expected = {};
	c.resolveTransaction = {};
	c.transactionPromise = {};

	c.domain = {};	
	c.Domain.create.expect().return(c.domain);

	c.newTransaction.expect(c.domain, c.pool).return(c.resolveTransaction);
	c.newPromise.expect(c.resolveTransaction).return(c.transactionPromise);

	c.transactionPromise.then = c.mock();
	c.beginPromise = {};
	c.transactionPromise.then.expect(c.begin).return(c.beginPromise);

	c.domain.run = c.mock();
	c.domain.run.expectAnything().whenCalled(onRun).return(c.expected);

	function onRun(cb) {
		var res = cb();
		if (res != c.beginPromise)
			throw new Error('wrong result');
	}

	c.returned = c.sut.transaction();

}

module.exports = act;