function act(c){
	c.foo = {};
	c.bar = {};
	c.pools.foo = c.foo;
	c.pools.bar = c.bar;

	c.foo.end = c.mock();
	c.fooPromise = 'foop';
	c.foo.end.expect().return(c.fooPromise);

	c.bar.end = c.mock();
	c.barPromise = 'barp';
	c.bar.end.expect().return(c.barPromise);
	
	c.promise.all = c.mock();
	c.expected = {};
	c.promise.all.expect([c.fooPromise, c.barPromise]).return(c.expected);	

	c.returned = c.sut.end();
}

module.exports = act;