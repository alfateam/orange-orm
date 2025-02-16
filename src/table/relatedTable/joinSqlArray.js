const newShallowJoinSql = require('../query/singleQuery/joinSql/newShallowJoinSql');

function _new(context, relations) {

	let result = [];
	let leftAlias =  relations[0].parentTable._dbName;
	let rightAlias = 'z';
	let sql;


	let c = {};
	c.visitJoin = function(relation) {
		sql = newShallowJoinSql(context, relation.childTable,relation.columns,relation.childTable._primaryColumns,leftAlias,rightAlias).prepend(' LEFT').sql();
	};

	c.visitOne = function(relation) {
		sql = newShallowJoinSql(context, relation.childTable,relation.parentTable._primaryColumns,relation.joinRelation.columns,leftAlias,rightAlias).prepend(' LEFT').sql();
	};

	c.visitMany = c.visitOne;

	for (let i = 0; i < relations.length; i++) {
		rightAlias = rightAlias + relations[i].toLeg().name;
		relations[i].accept(c);
		result.push(sql);
		leftAlias = rightAlias;
	}

	return result;
}

module.exports = _new;