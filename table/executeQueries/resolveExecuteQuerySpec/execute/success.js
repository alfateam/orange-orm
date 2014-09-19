var rows = {};

function act(c){
	c.rows = rows;		
	c.onSuccess.expect(rows);
	if (c.queryCompleted)
		c.queryCompleted(null,c.rows);
}

module.exports = act;