import orange from '../../src/index';
orange.map(x => ({
 item: x.table('items').map(({column}) => ({
  id: column('id').numeric().primary(),
  total: column('total').numeric().sync({push:false}).notNullExceptInsert(),
  name: column('name').string().sync({push:true}),
  details: column('details').jsonOf<{count:number}>().sync({push:false}),
  // @ts-expect-error Only a boolean is valid.
  invalid: column('invalid').numeric().sync({push:'false'}),
  // @ts-expect-error Pull exclusion is not part of this API.
  unsupported: column('unsupported').numeric().sync({pull:false}),
 }))
}));
