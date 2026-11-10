import orange from '../../src';

const map = orange.map(({ table }) => ({
  item: table('item').map(({ column }) => ({ id: column('id').numeric().primary() }))
}));
const db = map.sqlite(':memory:');
db.transaction(async tx => {
  await tx.advisoryLock('invoice:123');
  // @ts-expect-error Keys must be strings.
  await tx.advisoryLock(123);
  await tx.item.getById(1);
});
// @ts-expect-error Locks are available only inside a transaction.
db.advisoryLock('key');

const http = map.http('http://localhost');
// @ts-expect-error HTTP does not expose advisory locks.
http.advisoryLock('key');
// @ts-expect-error HTTP does not expose local transactions.
http.transaction(async () => {});
const configuredHttp = map({ db: con => con.http('http://localhost') });
// @ts-expect-error HTTP does not expose local transactions.
configuredHttp.transaction(async () => {});
// @ts-expect-error HTTP does not expose advisory locks.
configuredHttp.advisoryLock('key');
const derivedHttp = db({ db: con => con.http('http://localhost') });
// @ts-expect-error HTTP does not expose local transactions.
derivedHttp.transaction(async () => {});
