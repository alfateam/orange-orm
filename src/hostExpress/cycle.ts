// Utility to decrement recursion depth
type DecrementDepth<D extends any[]> = D extends [any, ...infer Rest] ? Rest : never;

// Define the structure of each node's definition within NodeTypeMap
// NodeKey is a string (or a type union of strings) that identifies a node.
type NodeDefinition = {
  base: {}; // Base type of the node
  children?: Record<string, string>; // childPropName -> childNodeKey
  parent?: { prop: string; node: string }; // parentPropName, parentNodeKey
};

// A map of node keys to their definitions
type NodeTypeMap = {
  [NodeKey: string]: NodeDefinition;
};

// The RecursiveNode type:
// D: depth array
// M: the NodeTypeMap
// K: the NodeKey for the current node
//
// If D is empty, we return just the base type.
// If not empty, we return the base type plus recursively expanded children and parent.
type RecursiveNode<
  D extends any[],
  M extends Record<string, NodeDefinition>,
  K extends keyof M
> = D extends []
  ? // At zero depth, just return the base type of this node
    M[K]['base']
  : // Non-zero depth:
    // Start with the base type
    M[K]['base']
    // Add recursively expanded children, if any
    & (M[K]['children'] extends Record<string, string>
       ? { [ChildProp in keyof M[K]['children']]:
            RecursiveNode<DecrementDepth<D>, M, M[K]['children'][ChildProp]> }
       : {})
    // Add recursively expanded parent, if defined
    & (M[K]['parent'] extends { prop: string; node: string }
       ? { [P in M[K]['parent']['prop']]:
            RecursiveNode<DecrementDepth<D>, M, M[K]['parent']['node']> }
       : {});

// ================== EXAMPLE USAGE ==================

// Define your base types (clean, no recursion)
type ABase = { name: string; foo: number };
type BBase = { title: string; bar: number };
type CBase = { label: string; baz: boolean };
type DBase = { tag: string; qux: string };

// Now define a NodeTypeMap describing the structure:
// Let's say we have a graph like before, but arbitrary children.
// A has three children: bChild -> B, cChild -> C, dChild -> D
// B, C, D each have a parent going back to A
// D also has a cLink -> C

type MyNodeTypeMap = {
  A: {
    base: ABase;
    children: {
      bChild: 'B';
      cChild: 'C';
      dChild: 'D';
    };
    // No parent defined for A (root)
  };
  B: {
    base: BBase;    
    children: {
        fooLink: 'C'; // D links to C as well
      };
    parent: { prop: 'aParent'; node: 'A' };
  };
  C: {
    base: CBase;
    // C has no children defined here
    parent: { prop: 'aParent'; node: 'A' };
  };
  D: {
    base: DBase;
    children: {
      cLink: 'C'; // D links to C as well
    };
    parent: { prop: 'aParent'; node: 'A' };
  };
};

// Limit recursion to depth 2
type Depth2 = [unknown, unknown, unknown, unknown];

// Now we can create a type for each node expanded to Depth2:
type MyA = RecursiveNode<Depth2, MyNodeTypeMap, 'A'>;
type MyB = RecursiveNode<Depth2, MyNodeTypeMap, 'B'>;
type MyC = RecursiveNode<Depth2, MyNodeTypeMap, 'C'>;
type MyD = RecursiveNode<Depth2, MyNodeTypeMap, 'D'>;

// Create an instance of MyA:
const aInstance: MyA = {
  name: "Root A",
  foo: 1,
  bChild: {
    title: "B Node",
    bar: 100,
    aParent: {
      name: "A Level 2",
      foo: 2,
      bChild: { title: "B2", bar: 200, aParent: { name: "A Terminal", foo: 3 } },
      cChild: { label: "C2", baz: true, aParent: { name: "A Terminal", foo: 4 } },
      dChild: {
        tag: "D2",
        qux: "XYZ",
        aParent: { name: "A Terminal", foo: 5 },
        cLink: { label: "C-Terminal", baz: false }
      }
    }
  },
  cChild: {
    label: "C Node",
    baz: true,
    aParent: {
      name: "A Level 2C",
      foo: 10,
      bChild: { title: "B3", bar: 300, aParent: { name: "A Terminal", foo: 6 } },
      cChild: { label: "C3", baz: false, aParent: { name: "A Terminal", foo: 7 } },
      dChild: {
        tag: "D3",
        qux: "ABC",
        aParent: { name: "A Terminal", foo: 8 },
        cLink: { label: "C-Terminal2", baz: true }
      }
    }
  },
  dChild: {
    tag: "D Node",
    qux: "QWE",
    aParent: {
      name: "A Level 2D",
      foo: 20,
      bChild: { title: "B4", bar: 400, aParent: { name: "A Terminal", foo: 9 } },
      cChild: { label: "C4", baz: true, aParent: { name: "A Terminal", foo: 11 } },
      dChild: {
        tag: "D4",
        qux: "DEF",
        aParent: { name: "A Terminal", foo: 12 },
        cLink: { label: "C-Terminal3", baz: false }
      }
    },
    cLink: {
      label: "C Link Node",
      baz: false
    }
  }
};

console.log(aInstance.name);            // "Root A"
console.log(aInstance.bChild.title);    // "B Node"
console.log(aInstance.bChild.aParent.cChild.label); // "C2"
console.log(aInstance.dChild.aParent.dChild.cLink.baz); // true

// interface HasChild<C> {
//     child: C;
//   }
  
//   interface HasParent<P> {
//     parent: P;
//   }
  
//   interface AType<C> extends HasChild<C> {
//     name: string;
//   }
  
//   interface BType<P> extends HasParent<P> {
//     title: string;
//   }
  
//   // Here is the key part: By using a circular type definition, we create a 
//   // specific pair (CyclicA, CyclicB) that point to each other generically. 
//   // 'CyclicA' extends 'AType' and expects a child of type 'CyclicB'.
//   // 'CyclicB' extends 'BType' and expects a parent of type 'CyclicA'.
  
//   // Note: TypeScript allows this pattern as long as the interfaces are defined first.
//   // The cycle is established by the subsequent type definitions.
  
//   type CyclicA = AType<CyclicB>;
//   type CyclicB = BType<CyclicA>;
  
//   // Now 'CyclicA' and 'CyclicB' are fully defined, with a cyclical reference:
//   // CyclicA -> child: CyclicB
//   // CyclicB -> parent: CyclicA
  
//   // Example usage:
//   const aInstance: CyclicA ;
  

//   // Establish the cycle at runtime.

  
//   // We can now traverse back and forth:
//   console.log(aInstance.name);              // "Node A"
//   console.log(aInstance.child.title);       // "Node B"
//   console.log(aInstance.child.parent.name); // "Node A" (cycle complete)
  
//   // This pattern is generic. If you want another pair of cyclical types, 
//   // say X and Y, you can do:
  
//   type CyclicX = XType<CyclicY>; // define similarly using HasChild/HasParent
//   type CyclicY = YType<CyclicX>;
//   // ...and so forth, using the same building blocks.
  