import { BunFile } from 'bun';

export type HandleRequestOptions = {
  prefix?: string;
  admin?: {
    prefix: string;
    password: string;
  };
  assets?: {
    prefix: string;
    path: string;
  };
  controllers?: {
    path: string;
    cors: string;
    middleware?: Middleware;
  };
  catchAll?: {
    type: 'static' | 'controller';
    path: string;
  };
};

type Headers = {
  'accept-encoding'?: string;
  'accept-language'?: string;
  'content-length'?: string;
  'content-type'?: string;
  'user-agent'?: string;
  accept?: string;
  cookie?: string;
  connection?: string;
  host?: string;
  referer?: string;
  [key: string]: string | undefined;
};

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Body = { [key: string]: string | number | boolean | null | File };

function read<T>(
  from: 'query' | 'body' | 'cookie',
  name: string,
  type: 'string',
  defaultValue: T
): string | T;
function read<T>(
  from: 'query' | 'body' | 'cookie',
  name: string,
  type: 'number',
  defaultValue: T
): number | T;
function read<T>(
  from: 'query' | 'body' | 'cookie',
  name: string,
  type: 'boolean',
  defaultValue: T
): boolean | T;
function read<T>(
  from: 'query' | 'body' | 'cookie',
  name: string,
  type: 'file',
  defaultValue: T
): File | T;
function read<T>(
  from: 'query' | 'body' | 'cookie',
  name: string,
  type: 'string' | 'number' | 'boolean' | 'file',
  defaultValue: T
) {}

type ControllerRequest = {
  url: string;
  path: string;
  body: Body;
  query: Record<string, string>;
  method: Method;
  headers: Headers;
  read: typeof read;
};

export type ContentType = 'json' | 'html' | 'text' | 'file';

export type ControllerResponse = {
  setCookie: (name: string, value: string, maxAge: number) => void;
  setStatusCode: (code: number) => void;
  setContentType: (type: ContentType) => void;
  setCustomHeader: (name: string, value: string) => void;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | Date
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Controller = (
  request: ControllerRequest,
  response: ControllerResponse
) => JsonValue | Promise<JsonValue | BunFile>;

export type Middleware = (
  request: ControllerRequest,
  response: ControllerResponse
) => JsonValue | undefined;
