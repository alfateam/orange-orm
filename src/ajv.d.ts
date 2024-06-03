export interface Options {
  $data?: boolean;
  allErrors?: boolean;
  verbose?: boolean;
  jsonPointers?: boolean;
  uniqueItems?: boolean;
  unicode?: boolean;
  format?: false | string;
  formats?: object;
  keywords?: object;
  unknownFormats?: true | string[] | 'ignore';
  schemas?: Array<object> | object;
  schemaId?: '$id' | 'id' | 'auto';
  missingRefs?: true | 'ignore' | 'fail';
  extendRefs?: true | 'ignore' | 'fail';
  loadSchema?: (uri: string, cb?: (err: Error, schema: object) => void) => PromiseLike<object | boolean>;
  removeAdditional?: boolean | 'all' | 'failing';
  useDefaults?: boolean | 'empty' | 'shared';
  coerceTypes?: boolean | 'array';
  strictDefaults?: boolean | 'log';
  strictKeywords?: boolean | 'log';
  strictNumbers?: boolean;
  async?: boolean | string;
  transpile?: string | ((code: string) => string);
  meta?: boolean | object;
  validateSchema?: boolean | 'log';
  addUsedSchema?: boolean;
  inlineRefs?: boolean | number;
  passContext?: boolean;
  loopRequired?: number;
  ownProperties?: boolean;
  multipleOfPrecision?: boolean | number;
  errorDataPath?: string,
  messages?: boolean;
  sourceCode?: boolean;
  processCode?: (code: string, schema: object) => string;
  cache?: object;
  logger?: CustomLogger | false;
  nullable?: boolean;
  serialize?: ((schema: object | boolean) => any) | false;
}

export interface CustomLogger {
  log(...args: any[]): any;
  warn(...args: any[]): any;
  error(...args: any[]): any;
}
