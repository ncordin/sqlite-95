import os from 'os';
import { Controller } from '../..';
import {
  getRequestsPerHour,
  getRequestsPerSecond,
} from '../../controller/monitoring';

const controller: Controller = async () => {
  const pid = process.pid;
  const isDarwin = process.platform === 'darwin';

  // Get process CPU usage (fast):
  const psOutput = await Bun.$`ps -o %cpu= -p ${pid}`.text();
  const [cpu] = psOutput.trim().split(/\s+/);

  // Get GLOBAL CPU usage (slow):
  const topOutput = isDarwin
    ? await Bun.$`top -l 1 -n 0`.text()
    : await Bun.$`top -bn1`.text();

  const idleMatch = isDarwin
    ? topOutput.match(/CPU usage:.*?([\d.]+)% idle/)
    : topOutput.match(/%Cpu.*?([\d.]+)\s*id/);

  const loadAvg = os.loadavg();
  const totalCpu = idleMatch ? Math.round(100 - parseFloat(idleMatch[1])) : 0;
  const processMemory = Math.round(process.memoryUsage().rss / 1024 / 1024);

  return {
    loadAvg,
    processCpu: parseFloat(cpu) || 0,
    totalCpu,
    processMemory,
    requestsPerSecond: Math.max(1, getRequestsPerSecond()),
    requestsPerHour: getRequestsPerHour(),
  };
};

export default controller;
