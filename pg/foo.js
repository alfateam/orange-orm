let inspect = require('util').inspect;
let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);
if (major < 8)
    return;

let ah = require('async_hooks');
let stack = {};
let hook = ah.createHook({
    init,
    destroy
});
hook.enable();
process.rdbstack = stack;

function init(asyncId, type, triggerId) {
    stack[asyncId] = {
        parent: triggerId
    };
}

function destroy(asyncId) {
    // delete stack[asyncId];
}

let cls = {};
cls.createContext = createContext;
cls.getContext = getContext;

function createContext(ns) {
    let c = {};

    Object.defineProperty(c, 'run', {
        enumerable: false,
        writable: false,
        value: run
    });

    Object.defineProperty(c, 'start', {
        enumerable: false,
        writable: false,
        value: start
    });

    return c

    async function run(cb) {
        return Promise.resolve(1).then(async () => {
            stack[ah.executionAsyncId()][ns] = c;
            let res = await cb();
            return res;
        });
    }

    function start() {
        return Promise.resolve(1).then(() => {
            stack[ah.executionAsyncId()][ns] = c;
        });
    }
}

function getContext(ns, asyncId, cur = []) {
    asyncId = asyncId || ah.executionAsyncId();
    let current = stack[asyncId];
    if (!current)
        throw new Error('Context \'' + ns + '\' not found ');
    if (current[ns])
        return current[ns];
    if (current.parent) {
        cur.push(current.parent);
        return getContext(ns, current.parent, cur);
    }
    throw new Error('Context \'' + ns + '\' not found');
}

module.exports = cls;

function begin(id) {
    let context = cls.getContext('rdb');
    context.id = id;
}

function getById() {
    let context = cls.getContext('rdb');
    return context.id;
}

async function getFromDb() {
    await begin(1);
    console.log('getFromDb before ' + ah.executionAsyncId());
    let ns1 = cls.createContext('rdb');
    await ns1.run(getFromDb3);
    await Promise.resolve(1);
    console.log('getFromDb after ' + ah.executionAsyncId());
    let id = await getById();
    if (id !== 1)
        throw new Error('1 Unexpected context id : ' + id)
}

async function getFromDb2() {
    await begin(2);
    let id = await getById();
    if (id !== 2)
        throw new Error('2 Unexpected context id : ' + id)
}

async function getFromDb3() {
    await begin(3);
    await new Promise((resolve, reject) => {
        setTimeout(resolve(), 1000);
    });
    let id = await getById();
    if (id !== 3)
        throw new Error('3 Unexpected context id : ' + id)
}


async function test() {
    // let customP = {
    //     then: function (resolve, reject) {
    //         console.log('start ' + ah.executionAsyncId());
    //         return Promise.resolve('').then(resolve, reject);
    //     }
    // };

    let customP = new Promise((resolve, reject) => {
        console.log('start ' + ah.executionAsyncId());
        return Promise.resolve('').then(resolve, reject);


    });

    // let customP =  Promise.resolve(1);
    let ns1 = cls.createContext('rdb');
    let p1 = ns1.start().then(() => {
        // console.log('start ' + ah.executionAsyncId());
        // console.log(ah.triggerAsyncId());
        return customP;
    });

    await p1;
    console.log(ah.executionAsyncId());

    // let p1 = ns1.run(getFromDb);

    // let ns2 = cls.createContext('rdb');
    // let p2 = ns2.run(getFromDb2);
    // await p1.then(() => {
    //     // console.log('then ' + ah.executionAsyncId());
    // });
    // await Promise.all([p1]);

    // return Promise.all([p1, p2]);
}

test().then(() => console.log(stack));