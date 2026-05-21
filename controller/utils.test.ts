import { expect, test } from 'bun:test';
import { joinPrefix } from './utils/http';

test('join empty prefixes', () => {
  expect(joinPrefix('', '')).toBe('/');
  expect(joinPrefix('/', '')).toBe('/');
  expect(joinPrefix('', '/')).toBe('/');
  expect(joinPrefix('/', '/')).toBe('/');
});

test('join with one empty prefix', () => {
  expect(joinPrefix('', 'second')).toBe('/second/');
  expect(joinPrefix('/', 'second')).toBe('/second/');
  expect(joinPrefix('', 'second/')).toBe('/second/');
  expect(joinPrefix('', '/second')).toBe('/second/');
  expect(joinPrefix('/', '/second')).toBe('/second/');
  expect(joinPrefix('/', 'second/')).toBe('/second/');
  expect(joinPrefix('/', '/second/')).toBe('/second/');
});

test('join two prefixes', () => {
  expect(joinPrefix('first', 'second')).toBe('/first/second/');
  expect(joinPrefix('first/', 'second')).toBe('/first/second/');
  expect(joinPrefix('first', 'second/')).toBe('/first/second/');
  expect(joinPrefix('first', '/second')).toBe('/first/second/');
  expect(joinPrefix('/first', 'second')).toBe('/first/second/');
  expect(joinPrefix('/first', '/second')).toBe('/first/second/');
  expect(joinPrefix('first/', 'second/')).toBe('/first/second/');
  expect(joinPrefix('/first/', '/second/')).toBe('/first/second/');
});

test('join long prefixes', () => {
  expect(joinPrefix('first/long/prefix/', '/second/is/also/long')).toBe(
    '/first/long/prefix/second/is/also/long/'
  );
});

test('fix mal formatted prefixes', () => {
  expect(joinPrefix('first//', 'second')).toBe('/first/second/');
  expect(joinPrefix('first/', '//second')).toBe('/first/second/');
  expect(joinPrefix('first/', 'second//')).toBe('/first/second/');
  expect(joinPrefix('/first', '//second')).toBe('/first/second/');
  expect(joinPrefix('/first///', 'second///')).toBe('/first/second/');
  expect(joinPrefix('/first///', '///second')).toBe('/first/second/');
  expect(joinPrefix('first////', 'second///')).toBe('/first/second/');
  expect(joinPrefix('/first////', '/second////')).toBe('/first/second/');
});
