// Import Node.js Dependencies
import dns from "node:dns/promises";

export async function dnsresolve(ip: string): Promise<string> {
  try {
    const hostNames = await dns.reverse(ip);

    return hostNames.join(", ");
  }
  catch {
    return ip;
  }
}
