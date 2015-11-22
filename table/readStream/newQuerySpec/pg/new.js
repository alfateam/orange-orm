function act(c) {
	c.expected = {};
	c.newPgQuery.expect(c.table, c.initialFilter, c.span, c.alias).return(c.expected);
	c.db.accept.expectAnything().whenCalled(onAccept);
	function onAccept (caller) {
		if (caller.visitPg)
			caller.visitPg();
	}
	c.returned = c.sut(c.db, c.table, c.initialFilter, c.span, c.alias);
}

module.exports = act;
