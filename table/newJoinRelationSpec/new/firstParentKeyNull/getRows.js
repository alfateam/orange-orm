function act(c){
	var parentRow = {};
	parentRow[c.fooColumnName]	= null;
	
	c.returned = c.sut.getFromDb(parentRow);
}
act.base = '../../new.js';
module.exports = act;