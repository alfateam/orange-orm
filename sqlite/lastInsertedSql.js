function selectLastInsertedSql(tableName, columnNames, keyValues) {
    return `rowid IN (select last_insert_rowid())`;
}

module.exports = selectLastInsertedSql;