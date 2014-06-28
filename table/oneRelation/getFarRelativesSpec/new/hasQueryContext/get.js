function act (c) {
	c.rows = {};
	c.resultToRows.expect(c.subSpan, c.result).return(c.rows);
	c.sut(c.relation, c.parent).then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}

}

module.exports = act;