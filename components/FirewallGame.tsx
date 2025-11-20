
import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Zap, Server, Play, RotateCcw, Heart, Lock, Gauge, Skull, Globe, FileCode, Film, Database, Flag, Bug, Box } from 'lucide-react';

interface FirewallGameProps {
  addXP: (amount: number) => void;
}

type PacketVariant = 'standard' | 'worm' | 'trojan' | 'stealth';

interface Packet {
  id: number;
  port: number;
  protocol: 'TCP' | 'UDP';
  origin: string; // Country Code
  content: 'DATA' | 'MEDIA' | 'EXE';
  variant: PacketVariant;
  
  // Physics
  x: number; // Percentage 0-100
  yOffset: number; // For sine wave movement
  speed: number;
  
  // Game State
  clicksRemaining: number;
  destroyed: boolean;
  name: string; // e.g., "HTTP", "SSH"
}

interface Rule {
  id: number;
  description: string;
  type: 'port' | 'protocol' | 'origin' | 'content';
  validator: (p: Packet) => boolean; // Returns TRUE if packet should be BLOCKED
}

type Difficulty = 'recruit' | 'agent' | 'specops';

const COMMON_PORTS = [
    { port: 80, name: 'HTTP', type: 'Web' },
    { port: 443, name: 'HTTPS', type: 'SecWeb' },
    { port: 21, name: 'FTP', type: 'File' },
    { port: 22, name: 'SSH', type: 'Shell' },
    { port: 53, name: 'DNS', type: 'Name' },
    { port: 3389, name: 'RDP', type: 'Remote' },
];

const ORIGINS = ['US', 'CN', 'RU', 'DE', 'BR'];
const CONTENT_TYPES = ['DATA', 'MEDIA', 'EXE'] as const;

const DIFFICULTY_CONFIG = {
    recruit: { 
        label: 'RECRUIT', 
        color: 'text-green-500', 
        speedBase: 0.1, 
        speedMulti: 0.02, 
        spawnBase: 2500, 
        spawnMin: 800, 
        damage: 5,
        xpMulti: 0.5
    },
    agent: { 
        label: 'AGENT', 
        color: 'text-yellow-500', 
        speedBase: 0.2, 
        speedMulti: 0.04, 
        spawnBase: 2000, 
        spawnMin: 500, 
        damage: 10,
        xpMulti: 1.0
    },
    specops: { 
        label: 'SPECOPS', 
        color: 'text-red-500', 
        speedBase: 0.35, 
        speedMulti: 0.06, 
        spawnBase: 1200, 
        spawnMin: 250, 
        damage: 20,
        xpMulti: 2.0
    }
};

const FirewallGame: React.FC<FirewallGameProps> = ({ addXP }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('agent');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [wave, setWave] = useState(1);
  
  const requestRef = useRef<number>(0);
  const lastPacketTime = useRef<number>(0);
  const lastRuleChangeTime = useRef<number>(0);
  const packetIdCounter = useRef<number>(0);

  // --- Game Logic ---

  const generateRule = (currentWave: number): Rule => {
      const allowedTypes = ['port'];
      if (currentWave > 2) allowedTypes.push('protocol');
      if (currentWave > 4) allowedTypes.push('origin');
      if (currentWave > 6) allowedTypes.push('content');

      const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)] as Rule['type'];
      const shouldBlock = Math.random() > 0.5;
      
      if (type === 'origin') {
          const target = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
          return {
              id: Date.now(),
              type: 'origin',
              description: shouldBlock ? `BLOCK Traffic from ${target}` : `ALLOW ONLY Traffic from ${target}`,
              validator: (p) => shouldBlock ? p.origin === target : p.origin !== target
          };
      }
      
      if (type === 'content') {
          const target = CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)];
          return {
              id: Date.now(),
              type: 'content',
              description: shouldBlock ? `BLOCK ${target} Content` : `ALLOW ONLY ${target} Content`,
              validator: (p) => shouldBlock ? p.content === target : p.content !== target
          };
      }

      if (type === 'protocol') {
          const target = Math.random() > 0.5 ? 'TCP' : 'UDP';
          return {
              id: Date.now(),
              type: 'protocol',
              description: shouldBlock ? `BLOCK All ${target}` : `ALLOW ONLY ${target}`,
              validator: (p) => shouldBlock ? p.protocol === target : p.protocol !== target
          };
      }

      // Default: Port
      const target = COMMON_PORTS[Math.floor(Math.random() * COMMON_PORTS.length)];
      return {
          id: Date.now(),
          type: 'port',
          description: shouldBlock ? `BLOCK Port ${target.port} (${target.name})` : `ALLOW ONLY Port ${target.port}`,
          validator: (p) => shouldBlock ? p.port === target.port : p.port !== target.port
      };
  };

  const spawnPacket = () => {
      const portInfo = COMMON_PORTS[Math.floor(Math.random() * COMMON_PORTS.length)];
      packetIdCounter.current += 1;
      
      const config = DIFFICULTY_CONFIG[difficulty];
      const isTCP = Math.random() > 0.5;

      // Determine Variant based on wave
      let variant: PacketVariant = 'standard';
      if (wave > 3 && Math.random() > 0.8) variant = 'worm';
      if (wave > 5 && Math.random() > 0.85) variant = 'trojan';
      if (wave > 7 && Math.random() > 0.85) variant = 'stealth';

      let speed = config.speedBase + (wave * config.speedMulti);
      if (variant === 'stealth') speed *= 1.5;
      if (variant === 'trojan') speed *= 0.6;

      const newPacket: Packet = {
          id: packetIdCounter.current,
          port: portInfo.port,
          name: portInfo.name,
          protocol: isTCP ? 'TCP' : 'UDP',
          origin: ORIGINS[Math.floor(Math.random() * ORIGINS.length)],
          content: CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)],
          variant,
          x: 0,
          yOffset: 0,
          speed,
          clicksRemaining: variant === 'trojan' ? 2 : 1,
          destroyed: false
      };
      
      setPackets(prev => [...prev, newPacket]);
  };

  const startGame = () => {
      setGameState('playing');
      setScore(0);
      setHealth(100);
      setWave(1);
      setPackets([]);
      setCurrentRule(generateRule(1));
      lastPacketTime.current = Date.now();
      lastRuleChangeTime.current = Date.now();
  };

  const gameLoop = () => {
      if (gameState !== 'playing') return;

      const now = Date.now();
      const config = DIFFICULTY_CONFIG[difficulty];

      // Spawn Packets
      const spawnRate = Math.max(config.spawnMin, config.spawnBase - (wave * 150));
      if (now - lastPacketTime.current > spawnRate) {
          spawnPacket();
          lastPacketTime.current = now;
      }

      // Change Rule
      if (now - lastRuleChangeTime.current > 12000) {
          const nextWave = Math.min(20, wave + 1);
          setWave(nextWave);
          setCurrentRule(generateRule(nextWave));
          lastRuleChangeTime.current = now;
      }

      // Move Packets
      setPackets(prevPackets => {
          const nextPackets: Packet[] = [];
          let damageTaken = 0;

          prevPackets.forEach(p => {
              if (p.destroyed) return;

              // Move X
              p.x += p.speed;

              // Move Y (Worm logic)
              if (p.variant === 'worm') {
                  p.yOffset = Math.sin(p.x * 0.2) * 15;
              }

              // Check Collision with Server (x > 90)
              if (p.x > 90) {
                  if (currentRule && currentRule.validator(p)) {
                      // Malicious packet hit server
                      damageTaken += config.damage;
                  }
              } else {
                  nextPackets.push(p);
              }
          });

          if (damageTaken > 0) {
              setHealth(h => {
                  const newHealth = h - damageTaken;
                  if (newHealth <= 0) setGameState('gameover');
                  return newHealth;
              });
          }

          return nextPackets;
      });

      requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
      if (gameState === 'playing') {
          requestRef.current = requestAnimationFrame(gameLoop);
      }
      return () => cancelAnimationFrame(requestRef.current!);
  }, [gameState, wave, currentRule]); 

  const handlePacketClick = (id: number) => {
      if (gameState !== 'playing' || !currentRule) return;

      const config = DIFFICULTY_CONFIG[difficulty];

      setPackets(prev => prev.map(p => {
          if (p.id === id) {
              // Decrement health (Trojan logic)
              if (p.clicksRemaining > 1) {
                  return { ...p, clicksRemaining: p.clicksRemaining - 1 };
              }

              const shouldBlock = currentRule.validator(p);
              
              if (shouldBlock) {
                  // Good Hit
                  let points = 100;
                  if (p.variant === 'trojan') points = 250;
                  if (p.variant === 'worm') points = 150;
                  
                  setScore(s => s + points);
                  addXP(10 * config.xpMulti); 
                  return { ...p, destroyed: true }; 
              } else {
                  // Bad Hit (Blocked innocent traffic)
                  setHealth(h => {
                      const newH = h - config.damage;
                      if (newH <= 0) setGameState('gameover');
                      return newH;
                  });
                  return { ...p, destroyed: true };
              }
          }
          return p;
      }));
  };

  // --- Render Helpers ---

  const getVariantIcon = (v: PacketVariant) => {
      switch(v) {
          case 'trojan': return <Box size={24} className="text-orange-500" />;
          case 'worm': return <Bug size={24} className="text-neon-green" />;
          case 'stealth': return <Shield size={24} className="text-gray-400" />;
          default: return <Globe size={24} />;
      }
  };

  const getContentIcon = (c: Packet['content']) => {
      switch(c) {
          case 'MEDIA': return <Film size={12} />;
          case 'EXE': return <FileCode size={12} />;
          default: return <Database size={12} />;
      }
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 pt-12 h-full preserve-3d">
        
        {/* Header */}
        <div className="mb-6 text-center preserve-3d w-full">
             <h2 className="text-5xl font-mono font-bold text-red-500 mb-2 tracking-widest flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
                <Shield size={48} /> FIREWALL FRENZY
            </h2>
            <p className="text-gray-400">Defense Level {wave}. New threat vectors active.</p>
        </div>

        <div className="w-full max-w-5xl bg-black/80 backdrop-blur-xl border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden relative min-h-[600px] flex flex-col preserve-3d">
            
            {/* Menu Overlay */}
            {gameState === 'menu' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-fade-in p-8">
                    <Shield size={80} className="text-red-500 mb-6 animate-pulse" />
                    <h3 className="text-3xl font-bold text-white mb-4">System Breach Detected</h3>
                    <p className="text-gray-400 max-w-md text-center mb-8">
                        Incoming packets now contain <strong>Origin</strong> and <strong>Content Type</strong> metadata.
                        <br/>Adapt your filters accordingly.
                    </p>
                    
                    {/* Difficulty Select */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        {(['recruit', 'agent', 'specops'] as Difficulty[]).map(lvl => (
                            <button 
                                key={lvl}
                                onClick={() => setDifficulty(lvl)}
                                className={`
                                    px-6 py-4 rounded-xl border-2 flex flex-col items-center min-w-[120px] transition-all
                                    ${difficulty === lvl 
                                        ? `bg-gray-800 ${DIFFICULTY_CONFIG[lvl].color} border-current scale-110 shadow-lg` 
                                        : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}
                                `}
                            >
                                <div className="mb-2">{lvl === 'recruit' ? <Shield size={20}/> : lvl === 'agent' ? <Gauge size={20}/> : <Skull size={20}/>}</div>
                                <div className="font-bold uppercase text-sm">{DIFFICULTY_CONFIG[lvl].label}</div>
                                <div className="text-[10px] mt-1 opacity-70">{DIFFICULTY_CONFIG[lvl].xpMulti}x XP</div>
                            </button>
                        ))}
                    </div>

                    <button onClick={startGame} className="px-10 py-4 bg-red-600 text-white font-bold rounded-full text-xl hover:bg-red-500 hover:scale-105 transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-2">
                        <Play fill="currentColor" /> START DEFENSE
                    </button>
                </div>
            )}

            {/* Game Over Overlay */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 animate-fade-in text-center">
                    <AlertTriangle size={80} className="text-yellow-500 mb-6 animate-bounce" />
                    <h3 className="text-4xl font-bold text-white mb-2">CRITICAL FAILURE</h3>
                    <p className="text-xl text-red-500 mb-6 font-mono">Firewall Breached at Wave {wave}</p>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 mb-8">
                        <div className="text-gray-500 text-sm uppercase">Final Score</div>
                        <div className="text-5xl font-bold text-white font-mono">{score}</div>
                        <div className="text-xs text-gray-500 mt-2">{DIFFICULTY_CONFIG[difficulty].label} Difficulty</div>
                    </div>
                    <button onClick={() => setGameState('menu')} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 flex items-center gap-2">
                        <RotateCcw size={20} /> SYSTEM REBOOT
                    </button>
                </div>
            )}

            {/* HUD */}
            <div className="bg-gray-900/90 p-4 border-b border-gray-700 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-6">
                     <div className="bg-black/50 px-4 py-2 rounded border border-red-500/30">
                         <div className="text-[10px] text-red-500 uppercase font-bold mb-1 flex items-center gap-2">
                            <span>Active Policy (Wave {wave})</span>
                            {currentRule?.type === 'origin' && <Flag size={12}/>}
                            {currentRule?.type === 'content' && <Database size={12}/>}
                         </div>
                         <div className="text-xl font-bold text-white animate-pulse">{currentRule?.description || 'Initializing...'}</div>
                     </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Score</div>
                        <div className="text-2xl font-mono text-white">{score}</div>
                    </div>
                    <div className="w-48">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400 flex items-center gap-1"><Server size={12}/> Integrity</span>
                            <span className={health < 30 ? "text-red-500 font-bold" : "text-green-500"}>{health}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                            <div className={`h-full transition-all duration-300 ${health < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${health}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 relative overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-90">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-red-500/20"></div>)}
                </div>

                {/* Server Zone */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-900/20 to-transparent border-l border-red-500/20 flex items-center justify-center">
                    <div className="text-center opacity-50">
                        <Server size={64} className="text-red-500 mx-auto mb-2" />
                        <div className="text-xs font-mono text-red-500">MAINFRAME</div>
                    </div>
                </div>

                {/* Packets */}
                {packets.map(packet => (
                    !packet.destroyed && (
                        <button
                            key={packet.id}
                            onClick={() => handlePacketClick(packet.id)}
                            className={`
                                absolute w-24 h-24 transform -translate-y-1/2 hover:scale-110 transition-transform active:scale-95 group cursor-crosshair
                                ${packet.variant === 'stealth' ? 'opacity-40 hover:opacity-100' : 'opacity-100'}
                            `}
                            style={{ 
                                left: `${packet.x}%`, 
                                top: `calc(${(packet.id % 5) * 15 + 10}% + ${packet.yOffset}px)`,
                                zIndex: 10
                            }}
                        >
                            {/* 3D Cube Packet */}
                            <div className="relative w-16 h-16 preserve-3d animate-float" style={{ animationDuration: packet.variant === 'worm' ? '1s' : '3s' }}>
                                <div className={`
                                    absolute inset-0 border-2 rounded-lg flex flex-col items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors
                                    ${currentRule?.validator(packet) 
                                        ? 'bg-red-900/80 border-red-500 text-red-100 shadow-red-500/20'  // Is Target (Malicious)
                                        : 'bg-blue-900/80 border-blue-400 text-blue-100 shadow-blue-500/20'} // Is Safe
                                    ${packet.variant === 'trojan' ? 'border-4 scale-110 bg-orange-900/80 border-orange-500' : ''}
                                `}>
                                    {/* Content Icons */}
                                    <div className="absolute top-1 right-1 opacity-50">{getContentIcon(packet.content)}</div>
                                    <div className="absolute top-1 left-1 text-[8px] font-bold bg-black/50 px-1 rounded">{packet.origin}</div>

                                    <div className="text-xs font-bold mb-1">{packet.protocol}</div>
                                    <div className="text-2xl font-mono font-bold">{packet.port}</div>
                                    
                                    {/* Special Variant Indicator */}
                                    {packet.variant !== 'standard' && (
                                        <div className="absolute -right-2 -top-2 bg-black rounded-full border border-white p-1">
                                            {getVariantIcon(packet.variant)}
                                        </div>
                                    )}

                                    {/* Trojan Health Bar */}
                                    {packet.variant === 'trojan' && (
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                            {[...Array(packet.clicksRemaining)].map((_, i) => (
                                                <div key={i} className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                ))}
            </div>

        </div>

        {/* Legend Footer */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
             <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-700 px-3 py-2 rounded bg-black/40">
                 <Flag size={14} className="text-neon-blue"/> <span>Origin</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-700 px-3 py-2 rounded bg-black/40">
                 <Database size={14} className="text-neon-purple"/> <span>Content Type</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-700 px-3 py-2 rounded bg-black/40">
                 <Box size={14} className="text-orange-500"/> <span>Trojan (2 Clicks)</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-700 px-3 py-2 rounded bg-black/40">
                 <Bug size={14} className="text-neon-green"/> <span>Worm (Erratic)</span>
             </div>
        </div>
    </div>
  );
};

export default FirewallGame;
