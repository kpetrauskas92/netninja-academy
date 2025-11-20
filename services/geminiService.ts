
// Mock AI service for offline/static deployment

export const isAIEnabled = (): boolean => {
  return false;
};

const HINT_DB: Record<string, string[]> = {
    "binary": [
        "Remember: Binary is Base-2. Each position is a power of 2 (1, 2, 4, 8...)",
        "To convert Decimal to Binary, try subtracting the largest power of 2 possible.",
        "8 bits make a Byte. The max value is 255 (11111111).",
        "Binary 1 is On, 0 is Off.",
        "128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255."
    ],
    "hex": [
        "Hexadecimal is Base-16. It uses 0-9 and A-F.",
        "A=10, B=11, C=12, D=13, E=14, F=15.",
        "Each Hex digit represents 4 binary bits (a nibble).",
        "0xFF is 255 in Decimal.",
        "Colors are often represented in Hex (RRGGBB)."
    ],
    "subnet": [
        "The /number (CIDR) tells you how many bits are locked for the Network.",
        "Subnet Mask: 1s are Network, 0s are Host.",
        "Broadcast Address is always the last IP in the subnet (all host bits set to 1).",
        "Network Address is the first IP (all host bits set to 0).",
        "Usable hosts = Total IPs - 2 (Network + Broadcast)."
    ],
    "route": [
        "Routers look at the Destination IP to decide where to send packets.",
        "Longest Prefix Match: The most specific route (highest /CIDR) wins.",
        "If an IP is inside the range of a subnet, it can be routed there.",
        "TTL (Time To Live) prevents packets from looping forever."
    ],
    "general": [
        "Analyze the pattern. Break it down into smaller steps.",
        "Check your math. Computers are exact!",
        "Try visualizing the bits.",
        "Don't rush. Accuracy beats speed."
    ]
};

export const getExplanation = async (concept: string, context: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Fake network delay to feel like "processing"
    
    const lowerContext = (concept + " " + context).toLowerCase();
    let type = "general";
    if (lowerContext.includes("binary") || lowerContext.includes("bit") || lowerContext.includes("decimal")) type = "binary";
    else if (lowerContext.includes("hex")) type = "hex";
    else if (lowerContext.includes("subnet") || lowerContext.includes("ip") || lowerContext.includes("cidr") || lowerContext.includes("mask")) type = "subnet";
    else if (lowerContext.includes("route") || lowerContext.includes("hop") || lowerContext.includes("packet")) type = "route";

    const hints = HINT_DB[type];
    return hints[Math.floor(Math.random() * hints.length)];
};

export const getSubnetBreakdown = async (ip: string, cidr: number, targetTask: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 600)); // Fake delay

    // Local calculation logic
    const ipToInt = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const intToIp = (int: number) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
    
    const mask = ~((1 << (32 - cidr)) - 1);
    const ipInt = ipToInt(ip);
    const netInt = ipInt & mask;
    const broadcastInt = netInt | (~mask >>> 0);
    const firstHost = intToIp(netInt + 1);
    const lastHost = intToIp(broadcastInt - 1);
    const totalHosts = Math.pow(2, 32 - cidr) - 2;

    return `
    Analysis for ${ip}/${cidr}:
    • CIDR /${cidr} means ${cidr} Network bits and ${32-cidr} Host bits.
    • Subnet Mask: ${intToIp(mask >>> 0)}
    • Network Address: ${intToIp(netInt >>> 0)} (First IP)
    • Broadcast Address: ${intToIp(broadcastInt >>> 0)} (Last IP)
    • Usable Hosts: ${totalHosts} IPs (${firstHost} - ${lastHost})
    `;
};

export const getChatResponse = async (message: string, history: string[]): Promise<string> => {
    return "NetBot Offline: I am currently in static mode. Please use the Tutorial or Field Manual modules for assistance.";
}
