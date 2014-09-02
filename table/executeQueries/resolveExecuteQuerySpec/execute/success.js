var rows = {};

function act(c){
	c.rows = rows;		
	c.result = {};
	c.result.rows = rows;
	c.onSuccess.expect(rows);
	if (c.queryCompleted)
		c.queryCompleted(null,c.result);
}

module.exports = act;