
export enum GameMode {
  DASHBOARD = 'DASHBOARD',
  BINARY = 'BINARY',
  HEX = 'HEX',
  SUBNET = 'SUBNET',
  TUTORIAL = 'TUTORIAL',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
  PACKET_TRACER = 'PACKET_TRACER',
  SHOP = 'SHOP',
  SANDBOX = 'SANDBOX',
  FIREWALL = 'FIREWALL',
  THREAT_HUNTER = 'THREAT_HUNTER',
  EXPLOIT_LAB = 'EXPLOIT_LAB',
  PACKET_SNIFFER = 'PACKET_SNIFFER'
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  reqXp?: number;
  reqLevel?: number;
  reqStreak?: number;
}

export interface PlayerStats {
  xp: number;
  level: number;
  streak: number;
  badges: string[]; 
  inventory: string[]; // IDs of owned items
  equipped: {
    theme: string;
    avatar: string;
    frame: string;
  };
}

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface SubnetQuestion {
  ip: string;
  cidr: number;
  questionType: 'network' | 'broadcast' | 'first_host' | 'last_host' | 'usable_count' | 'cidr_to_mask' | 'mask_to_cidr';
  correctAnswer: string;
  options?: string[]; // For multiple choice
}

export interface DailyChallengeState {
  lastCompletedDate: string | null; 
  completedToday: boolean;
  currentStage: number; 
}

export interface ShopItem {
  id: string;
  type: 'theme' | 'avatar' | 'upgrade';
  name: string;
  description: string;
  price: number;
  icon: string;
  config?: any; // For themes: { colors: ... }
}