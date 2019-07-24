const ah = require('async_hooks');
const stack = {};
let hook = ah.createHook({ init, destroy });
hook.enable();

function init (asyncId, type, triggerId) {
    stack[asyncId] = {parent: triggerId};
}

function destroy(asyncId) {
    delete stack[asyncId];
}

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
    let ns1 = cls.createContext('rdb');
    await ns1.run(getFromDb3);
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
    let id = await getById();
    if (id !== 3)
        throw new Error('3 Unexpected context id : ' + id)
}

async function test() {
    let ns1 = cls.createContext('rdb');
    let p1 = ns1.run(getFromDb);

    let ns2 = cls.createContext('rdb');
    let p2 = ns2.run(getFromDb2);
    return Promise.all([p1,p2]);
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

    async function run(cb) {
        return Promise.resolve().then(() => {
            stack[ah.executionAsyncId()][ns] = c;
            return cb();
        });
    }
    return c;
}

function getContext(ns, asyncId) {
    asyncId = asyncId || ah.executionAsyncId();
    let current = stack[asyncId];
    if (!current)
        throw new Error('Namespace not found');
    if (current[ns])
        return current[ns];
    if (current.parent)
        return getContext(ns, current.parent);
    throw new Error('Namespace not found');
}


test().then(() => console.log(stack));