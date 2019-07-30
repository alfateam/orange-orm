let createDomain = require('../createDomain');
let newTransaction = require('./newTransaction');
let begin = require('../table/begin');
let commit = require('../table/commit');
let rollback = require('../table/rollback');
let newPool = require('./newPool');
let useHook = require('../useHook');
let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);

function newDatabase(connectionString, poolOptions) {
    let pool = newPool(connectionString, poolOptions);
    let c = {};

    c.transaction = function (options, fn) {
        if ((arguments.length === 1) && (typeof options === 'function')) {
            fn = options;
            options = undefined;
        }
        let domain = createDomain();

        if (fn)
            return domain.run(runInTransaction);
        else if ((major >= 12) && useHook) {
            domain.exitContext = true;
            return domain.start().then(run);
        }
        else
            return domain.run(run);

        async function runInTransaction() {
            let result;
            let transaction = newTransaction(domain, pool);
            await new Promise(transaction)
                .then(begin)
                .then(fn)
                .then((res) => result = res)
                .then(c.commit)
                .then(null, c.rollback);
            return result;
        }

        function run() {
            let transaction = newTransaction(domain, pool);
            return new Promise(transaction)
                .then(begin);
        }

    };

    c.rollback = rollback;
    c.commit = commit;

    c.end = function () {
        return pool.end();
    };

    c.accept = function (caller) {
        caller.visitSqlite();
    };

    return c;
}

module.exports = newDatabase;
