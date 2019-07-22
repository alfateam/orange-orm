function runInTransaction({options, db, fn}) {
    return new Promise(function(resolve, reject) {
        let result;

        db.transaction(options)
        .then(fn)
        .then(getResult)
        .then(db.commit)
        .then(onOk, db.rollback)
        .then(null, onError)

        function getResult(res) {
            result = res;
        }

        function onOk() {
            resolve(result);
            return result;
        }

        function onError(e) {
            reject(e);
        }

    });
}

module.exports = runInTransaction;