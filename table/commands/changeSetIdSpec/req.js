var a = require('a');
var requireMock = a.requireMock;
var id = 'theId';
var createId = requireMock('../../newId');
createId.expect().return(id);

function act(c){
	c.id = id;
	c.returned = require('../changeSetId');
	c.returned2 = require('../changeSetId');
}

module.exports = act;