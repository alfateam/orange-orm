interface Foo {
  bar: string;
  baz: number;
}

export type Schema = {
  customers: {
    columns: {
      id: { type: 'uuid'; notNull: true };
      name: { type: 'string' };
      email: 'string';
      isActive: 'boolean';
      customType: { type: 'json'; tsType: Foo; };
      defaultAddressId: 'uuid';
    };
    primaryKey: ['id'];
    relations: {
      orders: {
        type: 'hasMany';
        target: 'orders';
      };
      defaultAddress: {
        type: 'hasOne';
        target: 'deliveryAddresses';
      };
    };
  };

  deliveryAddresses: {
    columns: {
      id: 'uuid';
      street: 'string';
      city: 'string';
      postalCode: 'string';
      country: 'string';
    };
    primaryKey: ['id'];
  };

  orders: {
    columns: {
      id: 'uuid';
      customerId: 'uuid';
      status: 'string';
      placedAt: 'date';
      deliveryAddressId: 'uuid';
    };
    primaryKey: ['id'];
    relations: {
      customer: {
        type: 'references';
        target: 'customers';
      };
      lines: {
        type: 'hasMany';
        target: 'orderLines';
      };
      deliveryAddress: {
        type: 'hasOne';
        target: 'deliveryAddresses';
      };
    };
  };

  orderLines: {
    columns: {
      orderId: 'uuid';
      productId: 'numeric';
      quantity: 'numeric';
      price: 'numeric';
    };
    primaryKey: ['orderId', 'productId'];
    relations: {
      order: {
        type: 'references';
        target: 'orders';
      };
      packages: {
        type: 'hasMany';
        target: 'packages';
      };
    };
  };

  packages: {
    columns: {
      id: 'uuid';
      orderLineOrderId: 'uuid';
      orderLineProductId: 'numeric';
      weight: 'numeric';
      shippedAt: 'date';
    };
    primaryKey: ['id'];
    relations: {
      orderLine: {
        type: 'references';
        target: 'orderLines';
      };
    };
  };
};
