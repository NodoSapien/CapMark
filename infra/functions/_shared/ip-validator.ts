// Módulo anti-SSRF: Validación de direcciones IP privadas y reservadas.

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = parseInt(part, 10);
    if (n < 0 || n > 255) return null;
    num = (num << 8) + n;
  }
  return num >>> 0;
}

export function isPrivateOrReservedIPv4(ip: string): boolean {
  const num = ipv4ToNumber(ip);
  if (num === null) return true; // Si no parsea como IPv4 válida, por seguridad se bloquea

  const inRange = (net: string, maskBits: number) => {
    const netNum = ipv4ToNumber(net)!;
    const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
    return (num & mask) === (netNum & mask);
  };

  // 0.0.0.0/8 (Broadcast/This network)
  if (inRange('0.0.0.0', 8)) return true;
  // 10.0.0.0/8 (Privada RFC 1918)
  if (inRange('10.0.0.0', 8)) return true;
  // 100.64.0.0/10 (Carrier-grade NAT RFC 6598)
  if (inRange('100.64.0.0', 10)) return true;
  // 127.0.0.0/8 (Loopback)
  if (inRange('127.0.0.0', 8)) return true;
  // 169.254.0.0/16 (Link-local / AWS & Cloud Metadata 169.254.169.254)
  if (inRange('169.254.0.0', 16)) return true;
  // 172.16.0.0/12 (Privada RFC 1918 / Docker default bridge network)
  if (inRange('172.16.0.0', 12)) return true;
  // 192.168.0.0/16 (Privada RFC 1918)
  if (inRange('192.168.0.0', 16)) return true;
  // 224.0.0.0/4 (Multicast)
  if (inRange('224.0.0.0', 4)) return true;
  // 240.0.0.0/4 (Reservada/Futuro)
  if (inRange('240.0.0.0', 4)) return true;

  return false;
}

export function isPrivateOrReservedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // Loopback ::1 o ::
  if (lower === '::1' || lower === '::') return true;
  // Unique Local Address fc00::/7
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // Link-local fe80::/10
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  // IPv4-mapped IPv6 ::ffff:x.x.x.x
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.slice('::ffff:'.length);
    return isPrivateOrReservedIPv4(v4);
  }
  // Multicast ff00::/8
  if (lower.startsWith('ff')) return true;

  return false;
}

export function isPrivateIP(ip: string): boolean {
  if (ip.includes(':')) {
    return isPrivateOrReservedIPv6(ip);
  }
  return isPrivateOrReservedIPv4(ip);
}
