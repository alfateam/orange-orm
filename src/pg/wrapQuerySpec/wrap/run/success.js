function act(c){
	c.rows = {};
	c.result = {};
	c.result.rows = c.rows;

	c.onCompleted.expect(null, c.rows);

	c.onInnerCompleted(null, c.result);
}

module.exports = act;