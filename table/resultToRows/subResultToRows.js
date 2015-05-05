var all = require('../promise').all;
var nextResultToRows = _nextResultToRows;
var resultToRows = require('../resultToRows');

function subResultToRows(span,result) {	
	var promises = [];
	var c2 = {};
	c2.visitJoin = function(leg) {
		promises.push(nextResultToRows(leg.span,result));
	};

	c2.visitOne = c2.visitJoin;

	c2.visitMany = function(leg) {		
		promises.push(resultToRows(leg.span, result));
	};
	
	function onEachLeg(leg) {			
		leg.accept(c2);
	}
	span.legs.forEach(onEachLeg);	
	return all(promises);
}

function _nextResultToRows(span,result) {
	nextResultToRows = require('./subResultToRows');
	return nextResultToRows(span,result);
}

module.exports = subResultToRows;