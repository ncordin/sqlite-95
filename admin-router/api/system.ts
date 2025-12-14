import Database from 'bun:sqlite';
import os from 'os';
import { Controller } from '../..';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatMemory(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

const controller: Controller = () => {
  const db = new Database(':memory:');
  const result = db
    .query("SELECT sqlite_version() as version, datetime('now') as datetime")
    .get() as {
    version: string;
    datetime: string;
  };
  db.close();

  const totalMem = os.totalmem();

  return {
    sqlite: result.version,
    bun: Bun.version,
    datetime: result.datetime,
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: formatMemory(totalMem),
    uptime: formatUptime(os.uptime()),
  };
};

export default controller;
