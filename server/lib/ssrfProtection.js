import { URL } from 'node:url';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data',
]);

/**
 * Checks if an IP string belongs to a private, loopback, or link-local subnet.
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return true;
    const [b0, b1] = parts;
    if (b0 === 10) return true; // 10.0.0.0/8
    if (b0 === 127) return true; // 127.0.0.0/8 loopback
    if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 link-local
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12
    if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16
    if (b0 === 0) return true; // 0.0.0.0/8
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // Unique local (fc00::/7)
    if (lower.startsWith('fe80:')) return true; // Link local (fe80::/10)
    return false;
  }
  return false;
}

/**
 * Validates whether an outbound URL is safe to fetch (non-internal, safe protocol).
 * @param {string} rawUrl
 * @param {string[]} allowedProtocols
 * @returns {boolean}
 */
export function isSafeOutboundUrl(rawUrl, allowedProtocols = ['https:', 'http:']) {
  try {
    const parsed = new URL(rawUrl);
    if (!allowedProtocols.includes(parsed.protocol)) return false;
    let hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) return false;
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }
    if (BLOCKED_HOSTNAMES.has(hostname)) return false;
    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return false;
    if (net.isIP(hostname) && isPrivateIp(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
