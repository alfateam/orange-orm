let inspect = require('util').inspect;
let ah = require('async_hooks');
let cls = require('../node-cls');
const fs = require('fs');
const log = (str) => fs.writeSync(1, `${str}\n`);


function begin(id) {
    return new Promise((resolve, reject) => {
        let context = cls.getContext('rdb');
        context.id = id;
        resolve();
    });
}

function getById() {
    return new Promise((resolve) => {
        let context = cls.getContext('rdb');
        context.id;
        resolve(context.id);
    })
}

async function getFromDb() {
    log('getFromDb before ' + ah.executionAsyncId());
    await begin(1);
    await new Promise((resolve, reject) => {
        setTimeout(500, resolve());
    });
    // let ns1 = cls.createContext('rdb');
    // await ns1.run(getFromDb3);
    // await Promise.resolve(1);
    // log('getFromDb after ' + ah.executionAsyncId());
    await getFromDb3();

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
    let c = cls.createContext('rdb');
    await c.start();
    log('getFromDB3 started ' + ah.executionAsyncId());
    await new Promise((resolve, reject) => {
        setTimeout(500, resolve());
    });
    await begin(3);
    await new Promise((resolve, reject) => {
        setTimeout(500, resolve());
    });
    log('begin3 ' + ah.executionAsyncId());
    // await new Promise((resolve, reject) => {
    //     setTimeout(resolve(), 1000);
    // });
    let id = await getById();
    log('exiting ' + ah.executionAsyncId());
    cls.exitContext('rdb');
    if (id !== 3)
        throw new Error('3 Unexpected context id : ' + id)
}


async function test() {
    // let c = cls.createContext('rdb');
    log('test before ' + ah.executionAsyncId());
    // await c.start();
    log(cls.getContext('rdb'));
    await getFromDb();
    log('after ' + ah.executionAsyncId());
    // cls.hook.disable();
    // log(JSON.stringify(cls._stack, null, 2));
    log(inspect(cls._stack, false, 10));

    // cls.exitContext('rdb');
    // return Promise.all([p1]);
}
async function foo() {
     cls.createContext('rdb').run(test).then(() => log('done'), (e) => log(e.stack));
    // await test().then(() => log('done'), (e) => log(e.stack));
}
foo();
