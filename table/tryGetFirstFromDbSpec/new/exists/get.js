var row = {};
var row2 = {};
var rows = [row,row2];

function act(c) {

	c.getMany.expect(c.table,c.filter,c.strategy).return(rows);
	c.row = row;
	c.get();
}

act.base = "../../new";
module.exports = act;