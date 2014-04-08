var extractParentKey = require('./extractParentKey');

function synchronizeChanged(manyCache, joinRelation, parent, child) {
    var columns = joinRelation.columns;
    columns.forEach(subscribeColumn);

    function subscribeColumn(column) {
        child.subscribeChanged(column.alias, onChanged);
    }

    function unsubscribe() {
        columns.forEach(unsubscribeColumn);

        function unsubscribeColumn(column) {
            child.unsubscribeChanged(column.alias, onChanged);
        }
    }

    function onChanged() {
        unsubscribe();
        manyCache.tryRemove(parent, child);
        var newParent = extractParentKey(joinRelation, child);
        manyCache.tryAdd(newParent, child);
    }



}

module.exports = synchronizeChanged;