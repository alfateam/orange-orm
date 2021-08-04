var relation = {};
var joinSql = '<joinSql>';


function act(c) {
    c.relation = relation;

    relation.accept = c.mock();
    relation.accept.expectAnything().whenCalled(onOne);

    function onOne(visitor) {
        visitor.visitOne(relation);
    }

    var rightTable = {};
    var leftColumns = {};
    var rightColumns = {};
    var joinRelation = {};
    var parentTable = {};
    parentTable._dbName = {};
    relation.joinRelation = joinRelation;
    relation.childTable = rightTable;
    joinRelation.childTable = parentTable;
    joinRelation.columns = rightColumns;
    parentTable._primaryColumns = leftColumns;
    c.newShallowJoinSql.expect(rightTable, leftColumns, rightColumns, parentTable._dbName, '_1').return(joinSql);

}

module.exports = act;
