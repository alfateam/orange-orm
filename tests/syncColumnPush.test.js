import { afterEach, describe, expect, test } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const orange = require('../src/index');
const filter = require('../src/sync/filterPushPatch');
const { buildSyncSchema, ensureSyncSchema } = require('../src/client/syncSchema');
const mapFromSchema = require('../src/client/mapFromSyncSchema');
const { setupChangeTracking } = require('../src/sync/setupChangeTracking');
const newDual = require('../src/sqliteOPFS/dualSyncDatabase');
const newSqlite = require('../src/sqlite3/newDatabase');
const cleanup = [];
afterEach(async () => { while (cleanup.length) await cleanup.pop()(); });
function mapping(push = false) {
 return orange.map(x => ({
  item: x.table('items').map(({ column }) => ({
   id: column('id').numeric().primary(), title: column('title').string(),
   total: column('total').numeric().notNullExceptInsert().sync({ push }),
   detail: column('detail').json().sync({ push })
  })),
  child: x.table('children').map(({ column }) => ({
   id: column('id').numeric().primary(), itemId: column('item_id').numeric(),
   total: column('total').numeric().sync({ push })
  }))
 })).map(x => ({item: x.item.map(({ hasMany }) => ({ children: hasMany(x.child).by('itemId') }))}));
}
function client(map) { return map({ db: () => ({}) }); }

test('validates options and primary keys in either chain order', () => {
 for (const build of [c => c.primary().sync({push:false}), c => c.sync({push:false}).primary()])
  expect(() => orange.map(x => ({ t: x.table('t').map(({column}) => ({id:build(column('id').numeric())}))}))).toThrow(/Primary key/);
 for (const options of [null, {push:'no'}, {pull:false}])
  expect(() => orange.map(x => ({t:x.table('t').map(({column})=>({v:column('v').numeric().sync(options)}))}))).toThrow(/Column sync/);
});

test('filters nested patches, whole rows, JSON paths and delete old values without mutating local patches', () => {
 const table = client(mapping()).tables.item;
 const patches = [
  {op:'replace',path:'/[1]/total',value:99,oldValue:2},
  {op:'replace',path:'/[1]/detail/nested',value:99},
  {op:'replace',path:'/[1]/children/[2]/total',value:99},
  {op:'add',path:'/[3]',value:{id:3,title:'new',total:7,children:{__patchType:'Array','[4]':{id:4,total:8}}}},
  {op:'remove',path:'/[1]',oldValue:{id:1,total:9}},
 ];
 const original = JSON.stringify(patches);
 const result = filter(table, patches);
 expect(result).toHaveLength(2);
 expect(result[0].value).toEqual({id:3,title:'new',children:{__patchType:'Array','[4]':{id:4}}});
 expect(result[1].oldValue).toEqual({id:1});
 expect(JSON.stringify(patches)).toBe(original);
 expect(filter(table, patches, true)[0].value.total).toBe(7);
});

test('preserves metadata in worker mapping and permits changing policy without resetting SQLite', async () => {
 const schema = buildSyncSchema(client(mapping()).tables, ['item','child']);
 const restored = client(mapFromSchema(orange, schema));
 expect(restored.tables.item.total._sync).toEqual({push:false});
 const db = mapping(true).sqlite(':memory:', {size:1}); cleanup.push(()=>db.close());
 await ensureSyncSchema(db, db, ['item','child']);
 await ensureSyncSchema(db, client(mapping()), ['item','child']);
});

for (const dual of [false,true]) describe(dual ? 'dual replica' : 'single replica', () => {
 test('keeps local writes, omits outgoing values and accepts server overwrites', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'orange-column-push-'));
  cleanup.push(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const map = mapping();
  const remote = map.pglite(undefined,{size:1}); cleanup.push(()=>remote.close());
  await remote.query('CREATE TABLE items (id integer PRIMARY KEY, title text, total integer NOT NULL DEFAULT 0, detail jsonb)');
  await remote.query('CREATE TABLE children (id integer PRIMARY KEY, item_id integer, total integer)');
  await setupChangeTracking(remote,remote.tables);
  await remote.item.insert({id:1,title:'server',total:30});
  const requests=[];
  const app=express().use(express.json()).use('/rdb',(req,res,next)=>{requests.push(req.body);next();}).use('/rdb',remote.express({sync:{}}));
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  cleanup.push(()=>new Promise(resolve=>server.close(resolve)));
  const sync={url:`http://127.0.0.1:${server.address().port}/rdb`, auto:false,worker:false};
  const filename=path.join(dir,'local.db');
  const connection=dual ? newDual(filename,{sync},(name,opts)=>newSqlite(name,{...opts,size:1})) : newSqlite(filename,{sync,size:1});
  const db=map({db:()=>connection});cleanup.push(()=>db.close());
  await db.syncClient.sync();
  let item=await db.item.getById(1);item.total=31;await item.saveChanges();
  expect((await db.item.getById(1)).total).toBe(31);
  expect(await db.query('SELECT * FROM orange_sync_outbox')).toHaveLength(0);
  item=await db.item.getById(1);item.title='local';item.total=32;await item.saveChanges();
  const outbox=await db.query('SELECT patch_json FROM orange_sync_outbox');
  expect(JSON.stringify(outbox)).not.toContain('/total');
  await remote.item.update({total:40},{where:x=>x.id.eq(1)});
  await db.item.syncById(1);
  expect((await db.item.getById(1)).total).toBe(40);
  expect((await db.item.getById(1)).title).toBe('local');
  await db.item.insert({id:2,title:'new local',total:9,detail:{local:true}});
  await db.item.syncById(1); // Replay the pending insert, preserving its local NOT NULL value.
  expect((await db.item.getById(2)).total).toBe(9);
  await db.syncClient.sync();
  expect((await remote.item.getById(1)).total).toBe(40);
  expect((await remote.item.getById(2)).total).toBe(0);
  expect((await db.item.getById(2)).total).toBe(0);
  const push=JSON.stringify(requests.filter(r=>r.phase==='push'));
  expect(push).not.toContain('replayPatch');expect(push).not.toContain('"total":9');expect(push).not.toContain('"local":true');
  // Server policy also protects against clients that did not filter the patch.
  const response=await fetch(sync.url+'?sync=push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phase:'push',clientId:'manual',mutations:[{id:'manual-1',patches:[{table:'item',patch:[{op:'replace',path:'/[1]/total',oldValue:40,value:999}]}]}]})});
  expect(response.ok).toBe(true);expect((await remote.item.getById(1)).total).toBe(40);
 },30000);
});
