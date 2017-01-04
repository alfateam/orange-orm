var arg = {};

function act(c){
	c.expected = {};
	c.contains.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.contains(arg,c.optionalAlias);
}

module.exports = act;