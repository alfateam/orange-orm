var rows = {};

function act(c){		
	c.result = {};
	c.result.rows = rows;
	c.onSuccess.expect(rows);
	if (c.queryCompleted)
		c.queryCompleted(null,c.result);
}

module.exports = act;