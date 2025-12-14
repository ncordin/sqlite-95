export async function getSystemMetrics() {
  const pid = process.pid;
  const isDarwin = process.platform === 'darwin';

  const psOutput = await Bun.$`ps -o %cpu=,rss= -p ${pid}`.text();
  const [cpu, rss] = psOutput.trim().split(/\s+/);

  const topOutput = isDarwin
    ? await Bun.$`top -l 1 -n 0`.text()
    : await Bun.$`top -bn1`.text();

  const idleMatch = isDarwin
    ? topOutput.match(/CPU usage:.*?([\d.]+)% idle/)
    : topOutput.match(/%Cpu.*?([\d.]+)\s*id/);

  const memMatch = isDarwin
    ? topOutput.match(/PhysMem:.*?(\d+)([MG]) used.*?(\d+)([MG]) unused/)
    : topOutput.match(/MiB Mem\s*:\s*([\d.]+)/);

  let totalMemoryMB = 0;
  if (isDarwin && memMatch) {
    const used = parseInt(memMatch[1]) * (memMatch[2] === 'G' ? 1024 : 1);
    const unused = parseInt(memMatch[3]) * (memMatch[4] === 'G' ? 1024 : 1);
    totalMemoryMB = used + unused;
  } else if (memMatch) {
    totalMemoryMB = Math.round(parseFloat(memMatch[1]));
  }

  return {
    processCpu: parseFloat(cpu) || 0,
    totalCpu: idleMatch ? Math.round(100 - parseFloat(idleMatch[1])) : 0,
    processMemoryMB: Math.round(parseInt(rss) / 1024) || 0,
    totalMemoryMB: (totalMemoryMB / 1000).toFixed(1),
  };
}

console.log(await getSystemMetrics());
