// utils/printServerInfo.ts
import os from 'os';

const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
//const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

function getNetworkAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return addresses;
}

export function printServerInfo(port: number | string): void {
  const localUrl = `http://localhost:${port}/`;

  console.info('');
  console.info(`  ${green('➜')}  ${bold('Local')}:   ${green(localUrl)}`);

  for (const ip of getNetworkAddresses()) {
    const networkUrl = `http://${ip}:${port}/`;
    console.info(`  ${green('➜')}  ${bold('Network')}: ${green(networkUrl)}`);
  }

  // console.info(`  ${dim('➜  press h + enter to show help')}`);
  console.info('');
}
