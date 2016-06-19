var rows = {};

function act(c){
	c.queryCount = 22;
	c.changeSet.queryCount = c.queryCount;
	c.rows = rows;		
	c.onSuccess.expect(rows);
	if (c.queryCompleted)
		c.queryCompleted(null,c.rows);
}

module.exports = act;