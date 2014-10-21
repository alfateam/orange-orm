var nextResultToRows = _nextResultToRows;
var resultToRows = require('../resultToRows');

function subResultToRows(span,result) {	
	var c2 = {};
	c2.visitJoin = function(leg) {
		nextResultToRows(leg.span,result);
	};

	c2.visitOne = c2.visitJoin;

	c2.visitMany = function(leg) {		
		resultToRows(leg.span, result);
	};
	
	function onEachLeg(leg) {			
		leg.accept(c2);
	}
	span.legs.forEach(onEachLeg);	
}

function _nextResultToRows(span,result) {
	nextResultToRows = require('./subResultToRows');
	nextResultToRows(span,result);
}

module.exports = subResultToRows;