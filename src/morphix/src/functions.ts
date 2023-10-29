// Import Node.js Dependencies
import dns from "node:dns/promises";

export function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export async function dnsresolve(ip: string): Promise<string> {
  try {
    const hostNames = await dns.reverse(ip);

    return hostNames.join(", ");
  }
  catch {
    return ip;
  }
}
