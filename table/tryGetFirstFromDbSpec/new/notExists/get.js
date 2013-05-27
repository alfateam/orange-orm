var rows = [];

function act(c) {
	c.getMany.expect(c.table,c.filter,c.strategy).return(rows);
	c.get();
}

act.base = "../../new";
module.exports = act;