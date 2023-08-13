let newRelatedTable = _newRelatedTable;
const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
let subFilter = require('./subFilter');
let isShallow = true;

function newAny(relations, depth) {

	function any(fn) {
		let relatedTable = newRelatedTable(relations.slice(-1), isShallow, depth + 1);
		let arg = typeof fn === 'function' ? fn(relatedTable) : fn;
		let filter = negotiateRawSqlFilter(arg);
		return subFilter(relations, filter, depth);
	}
	return any;
}

function _newRelatedTable() {
	newRelatedTable = require('../newRelatedTable');
	return newRelatedTable.apply(null, arguments);
}

module.exports = newAny;

//
// let newRelatedTable = _newRelatedTable;
// let negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');
// let newSelect = require('./selectSql');
// let newJoin = require('./joinSql');
// let newWhere = require('./whereSql');
// let subFilter = require('./subFilter');
// let isShallow = true;

// function newAny(relations, depth) {

// 	function any(fn) {
// 		let relationCount = relations.length;
// 		let alias = '_' + (depth);
// 		// let alias = '_' + relationCount;
// 		let table = relations[relationCount - 1].childTable;
// 		let exists = newSelect(table, alias).prepend('EXISTS (');
// 		let join = newJoin(relations, depth);

// 		let relatedTable = newRelatedTable(relations.slice(-1), isShallow, depth+1);
// 		let arg = typeof fn === 'function' ? fn(relatedTable) : fn; //we need inner joins from here
// 		let filter = negotiateRawSqlFilter(arg);
// 		let where = newWhere(relations[0],filter, depth);
// 		return exists.append(join).append(where).append(')');


// 		// let innerJoin = newJoinSql(relations);
// 		// let relatedTable = newRelatedTable(relations.slice(-1), isShallow);
// 		// //relations is missing anything below any(..)
// 		// let arg = typeof fn === 'function' ? fn(relatedTable) : fn; //we need inner joins from here
// 		// let filter = negotiateRawSqlFilter(arg);
// 		// let sqlFilter = filter.sql();
// 		// //_3.id is not null
// 		// return subFilter(relations.slice(-1), filter);
// 	}
// 	return any;
// 	// db.order.lines.any(x => x.order.deliveryAddress.id.notEqual(null));
// }

// function _newRelatedTable() {
// 	newRelatedTable = require('../newRelatedTable');
// 	return newRelatedTable.apply(null, arguments);
// }

// module.exports = newAny;