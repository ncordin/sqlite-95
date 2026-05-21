import { expect, test } from 'bun:test';
import { read } from './read';

const DEFAULT_VALUE = 'Default :)';

test('read as a string: main usages', () => {
  expect(read('Bonjour', 'string', DEFAULT_VALUE)).toBe('Bonjour');
  expect(read('', 'string', DEFAULT_VALUE)).toBe('');
  expect(read('42', 'string', DEFAULT_VALUE)).toBe('42');
  expect(read('true', 'string', DEFAULT_VALUE)).toBe('true');
  expect(read('false', 'string', DEFAULT_VALUE)).toBe('false');
  expect(read('null', 'string', DEFAULT_VALUE)).toBe('null');
});

test('read as a string: cast cases', () => {
  expect(read(42, 'string', DEFAULT_VALUE)).toBe('42');
  expect(read(0, 'string', DEFAULT_VALUE)).toBe('0');
  expect(read(-5.9, 'string', DEFAULT_VALUE)).toBe('-5.9');
});

test('read as a string: rejected cases', () => {
  expect(read(true, 'string', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(false, 'string', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(null, 'string', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(undefined, 'string', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read({ hi: 2 }, 'string', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(() => null, 'string', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
});

test('read as a number: main usages', () => {
  expect(read(42, 'number', DEFAULT_VALUE)).toBe(42);
  expect(read(0, 'number', DEFAULT_VALUE)).toBe(0);
  expect(read(-5.9, 'number', DEFAULT_VALUE)).toBe(-5.9);
});

test('read as a number: cast cases', () => {
  expect(read('42', 'number', DEFAULT_VALUE)).toBe(42);
  expect(read('0', 'number', DEFAULT_VALUE)).toBe(0);
  expect(read('-10', 'number', DEFAULT_VALUE)).toBe(-10);
  expect(read('20.5', 'number', DEFAULT_VALUE)).toBe(20.5);
  expect(read('30.9', 'number', DEFAULT_VALUE)).toBe(30.9);
});

test('read as a number: rejected cases', () => {
  expect(read('42-hi', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('hi-42', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('Bonjour', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('true', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('false', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('null', 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(true, 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(false, 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(null, 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(undefined, 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read({ hi: 2 }, 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(() => null, 'number', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
});

test('read as a boolean: main usages', () => {
  expect(read(true, 'boolean', DEFAULT_VALUE)).toBe(true);
  expect(read(false, 'boolean', DEFAULT_VALUE)).toBe(false);
});

test('read as a boolean: cast cases', () => {
  expect(read(1, 'boolean', DEFAULT_VALUE)).toBe(true);
  expect(read(0, 'boolean', DEFAULT_VALUE)).toBe(false);
  expect(read('1', 'boolean', DEFAULT_VALUE)).toBe(true);
  expect(read('0', 'boolean', DEFAULT_VALUE)).toBe(false);
  expect(read('true', 'boolean', DEFAULT_VALUE)).toBe(true);
  expect(read('false', 'boolean', DEFAULT_VALUE)).toBe(false);
});

test('read as a boolean: rejected cases', () => {
  expect(read('42', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('-10', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('20.5', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('42-hi', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('hi-42', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('Bonjour', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read('null', 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(null, 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(undefined, 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read({ hi: 2 }, 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
  expect(read(() => null, 'boolean', DEFAULT_VALUE)).toBe(DEFAULT_VALUE);
});
