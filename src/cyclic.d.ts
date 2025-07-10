// Type definitions using a type mapping approach
type EntityMap = {
  Order: {
    id: string;
    date: Date;
    total: number;
  };
  Line: {
    id: string;
    quantity: number;
    price: number;
  };
  Package: {
    id: string;
    trackingNumber: string;
    weight: number;
  };
  Customer: {
    id: string;
    name: string;
    email: string;
  };
};

// Enhanced relation mapping that includes cardinality information
type RelationMap = {
  Order: {
    lines: { type: 'Line'; isArray: true };
    customer: { type: 'Customer'; isArray: false };
  };
  Line: {
    packages: { type: 'Package'; isArray: true };
    order: { type: 'Order'; isArray: false };
  };
  Customer: {
    orders: { type: 'Order'; isArray: true };
  };
  Package: {};
};

// Helper type to extract the entity type from a relation
type RelationEntityType<R> = R extends { type: infer T extends keyof EntityMap } ? T : never;

// Helper type to determine if a relation is an array
type IsArray<R> = R extends { isArray: infer A extends boolean } ? A : false;

// Generic deep type resolver
type Depth = [never, 0, 1, 2, 3, 4, 5];

// RecursiveType generic with improved depth handling
type RecursiveType<
  T extends keyof EntityMap,
  D extends number = 5
> = {
  // Always include base properties
  [K in keyof EntityMap[T]]: EntityMap[T][K];
} & (D extends 0
  ? // At max depth, only include base properties (which are already included above)
    {}
  : // Otherwise include relations with appropriate depth reduction
    {
      [K in keyof RelationMap[T]]: IsArray<RelationMap[T][K]> extends true
        ? RecursiveType<
            RelationEntityType<RelationMap[T][K]>,
            Depth[D]
          >[]
        : RecursiveType<
            RelationEntityType<RelationMap[T][K]>,
            Depth[D]
          >;
    });

// Generate the entity types with relationships resolved to the specified depth
type Order = RecursiveType<'Order', 6>;

type Line = RecursiveType<'Line'>;
type Package = RecursiveType<'Package'>;
type Customer = RecursiveType<'Customer'>;

// Example usage
function processOrder(order: Order, line: Line) {
  // Can access nested properties up to depth 5
  // const trackingNumber = order.customer.orders[0].lines[0].order.lines[0].packages[0].
  // const orderId = order.customer.orders[0].customer.orders[0].lines[0].
  line.order.customer.orders[0].lines[0].packages[0].
  
  console.log(trackingNumber, orderId);
}

// Allow custom depth control per entity type
type OrderWithDepth1 = RecursiveType<'Order', 4>;

// Example with custom depth
function processOrderWithLimitedDepth(order: OrderWithDepth1) {
  // This would work (depth 1)  

  console.log(order.customer.id); // Can access base properties at max depth
  console.log(order.customer.name); // Can access base properties at max depth
  
  // This would error - beyond depth 1
  // console.log(order.customer.orders[0].id);
}

// Example of creating an instance with this type system
const sampleOrder: Order = {
  id: "ORD-123",
  date: new Date(),
  total: 299.99,
  customer: {
    id: "CUST-456",
    name: "John Doe",
    email: "john@example.com",
    orders: [
      /* would be recursive orders */
    ]
  },
  lines: [
    {
      id: "LINE-789",
      quantity: 2,
      price: 149.99,
      order: /* circular reference */,
      packages: [
        {
          id: "PKG-101",
          trackingNumber: "TRK123456789",
          weight: 1.5
        }
      ]
    }
  ]
};