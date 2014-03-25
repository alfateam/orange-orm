function act(c){
	var parentRow = {};
	parentRow[c.fooColumnName]	= null;
	
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new.js';
module.exports = act;