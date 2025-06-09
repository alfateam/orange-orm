export type Schema = {
  customers: {
    columns: {
      id: { type: 'uuid'; notNull: true };
      name: { type: 'string' };
      email: 'string';
      isActive: 'boolean';
      defaultAddressId: 'uuid';
    };
    primaryKey: ['id'];
    relations: {
      orders: {
        type: 'hasMany';
        target: 'orders';
        fkColumns: ['customerId'];
      };
      defaultAddress: {
        type: 'hasOne';
        target: 'deliveryAddresses';
        fkColumns: ['defaultAddressId'];
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
        fkColumns: ['customerId'];
      };
      lines: {
        type: 'hasMany';
        target: 'orderLines';
        fkColumns: ['orderId'];
      };
      deliveryAddress: {
        type: 'hasOne';
        target: 'deliveryAddresses';
        fkColumns: ['deliveryAddressId'];
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
        fkColumns: ['orderId'];
      };
      packages: {
        type: 'hasMany';
        target: 'packages';
        fkColumns: ['orderLineOrderId', 'orderLineProductId'];
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
        fkColumns: ['orderLineOrderId', 'orderLineProductId'];
      };
    };
  };
};
