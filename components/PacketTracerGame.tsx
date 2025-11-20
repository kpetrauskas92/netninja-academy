
import React, { useState, useEffect, useRef } from 'react';
import { getExplanation } from '../services/geminiService';
import { Router, Globe, CheckCircle, XCircle, HelpCircle, Clock, Activity, Microscope, Scan, AlertTriangle, Package, ArrowDown, List, Zap } from 'lucide-react';

interface PacketTracerGameProps {
  addXP: (amount: number) => void;
  inventory?: string[];
}

interface RouteOption {
  id: number;
  network: string;
  cidr: number;
  isCorrect: boolean;
}

interface Hop {
  routerName: string;
  options: RouteOption[];
}

const PacketTracerGame: React.FC<PacketTracerGameProps> = ({ addXP, inventory = [] }) => {
  const [level, setLevel] = useState(1);
  const [packetDest, setPacketDest] = useState('');
  const [hops, setHops] = useState<Hop[]>([]);
  const [currentHopIndex, setCurrentHopIndex] = useState(0);
  const [gameState, setGameState] = useState<'planning' | 'moving' | 'success' | 'failure'>('planning');
  const [feedback, setFeedback] = useState('');
  const [hint, setHint] = useState('');
  const [hoveredOption, setHoveredOption] = useState<RouteOption | null>(null);
  const [integrity, setIntegrity] = useState(100); 
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [ttl, setTtl] = useState(64);
  const [hopLog, setHopLog] = useState<string[]>(['Gateway']);

  const hasTimeDilation = inventory.includes('time_dilation');
  const animationDuration = hasTimeDilation ? 3000 : 1500; 

  // --- Audio Synth ---
  const playSound = (type: 'move' | 'success' | 'failure') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(554, now);
        osc2.frequency.linearRampToValueAtTime(1108, now + 0.2);
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.6);
        osc2.start(now);
        osc2.stop(now + 0.6);
    } else if (type === 'failure') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
  };

  // --- Helper Logic ---
  const ipToInt = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  const intToIp = (int: number) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
  const intToBinaryStr = (int: number) => (int >>> 0).toString(2).padStart(32, '0');

  const getUsableRange = (network: string, cidr: number) => {
      const netInt = ipToInt(network);
      const maskInt = ~((1 << (32 - cidr)) - 1) >>> 0;
      const broadcastInt = netInt | (~maskInt >>> 0);
      return `${intToIp(netInt)} - ${intToIp(broadcastInt)}`;
  };

  const isIpInSubnet = (ip: string, network: string, cidr: number) => {
    const ipNum = ipToInt(ip);
    const netNum = ipToInt(network);
    const mask = ~((1 << (32 - cidr)) - 1);
    return (ipNum & mask) === (netNum & mask);
  };

  const generateRandomIp = () => {
      return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
  };

  const generateNetworkForIp = (ip: string, cidr: number) => {
      const ipNum = ipToInt(ip);
      const mask = ~((1 << (32 - cidr)) - 1);
      return intToIp(ipNum & mask);
  };

  // --- Level Generation ---
  const generateLevel = () => {
      const targetIp = generateRandomIp();
      setPacketDest(targetIp);
      setGameState('planning');
      setCurrentHopIndex(0);
      setFeedback('');
      setHint('');
      setIntegrity(100); 
      setTtl(64);
      setHopLog(['Gateway']);
      setSelectedOptionIndex(null);

      const numHops = Math.min(3 + Math.floor(level / 2), 5);
      const newHops: Hop[] = [];

      for (let i = 0; i < numHops; i++) {
          const correctCidr = Math.floor(Math.random() * (30 - 16) + 16); 
          const correctNet = generateNetworkForIp(targetIp, correctCidr);
          
          const options: RouteOption[] = [];
          options.push({ id: 0, network: correctNet, cidr: correctCidr, isCorrect: true });

          for (let j = 1; j <= 2; j++) {
             let decoyIp = generateRandomIp();
             while (isIpInSubnet(targetIp, generateNetworkForIp(decoyIp, correctCidr), correctCidr)) {
                 decoyIp = generateRandomIp();
             }
             options.push({ id: j, network: generateNetworkForIp(decoyIp, correctCidr), cidr: correctCidr, isCorrect: false });
          }

          newHops.push({
              routerName: `Router-${String.fromCharCode(65 + i)}`,
              options: options.sort(() => Math.random() - 0.5)
          });
      }
      setHops(newHops);
  };

  useEffect(() => { generateLevel(); }, []);

  // Integrity Decay
  useEffect(() => {
      if (gameState !== 'planning' && gameState !== 'moving') return;
      
      const decayRate = hasTimeDilation ? 0.05 : 0.15; 
      const timer = setInterval(() => {
          setIntegrity(prev => {
              if (prev <= 0) {
                  setGameState('failure');
                  setFeedback('PACKET CORRUPTED. Integrity check failed.');
                  playSound('failure');
                  return 0;
              }
              return Math.max(0, prev - decayRate);
          });
      }, 100);

      return () => clearInterval(timer);
  }, [gameState, hasTimeDilation]);

  // --- Interaction ---
  const handleRouteSelect = (option: RouteOption, index: number) => {
      if (gameState !== 'planning') return;

      setSelectedOptionIndex(index);
      setGameState('moving');
      playSound('move');
      setHoveredOption(null);

      setTimeout(() => {
          if (option.isCorrect) {
              setTtl(t => t - 1);
              setHopLog(prev => [...prev, currentHop.routerName]);
              
              if (ttl <= 1) {
                  setGameState('failure');
                  setFeedback('TTL EXPIRED. Packet dropped.');
                  playSound('failure');
                  return;
              }

              if (currentHopIndex < hops.length - 1) {
                  setCurrentHopIndex(prev => prev + 1);
                  setGameState('planning');
                  setSelectedOptionIndex(null);
                  addXP(10);
              } else {
                  setGameState('success');
                  playSound('success');
                  addXP(100 + (level * 20) + Math.floor(integrity)); 
              }
          } else {
              setGameState('failure');
              setFeedback(`Packet Dropped! Route not found in table.`);
              playSound('failure');
          }
      }, animationDuration);
  };

  const nextLevel = () => { setLevel(l => l + 1); generateLevel(); };
  const retryLevel = () => { generateLevel(); };

  const getAIHint = async () => {
    const hop = hops[currentHopIndex];
    const context = `Finding route for IP ${packetDest}. Options: ${hop.options.map(o => o.network + '/' + o.cidr).join(', ')}.`;
    const text = await getExplanation("Routing Table Logic", context);
    setHint(text);
  };

  // --- Render Helpers ---
  const getPacketTransform = () => {
    if (gameState === 'planning') return 'translate(0, 0) scale(1)';
    
    const isMobile = window.innerWidth < 768; 
    const idx = selectedOptionIndex ?? 1;
    
    let x = 0;
    let y = 0;

    if (isMobile) {
        x = 0;
        y = 200 + (idx * 120);
    } else {
        x = (idx - 1) * 280;
        y = 250;
    }
    return `translate(${x}px, ${y}px) scale(0.2)`;
  };

  const renderBinaryComparison = (option: RouteOption) => {
      const destBin = intToBinaryStr(ipToInt(packetDest));
      const netBin = intToBinaryStr(ipToInt(option.network));
      const formatBin = (bin: string) => bin.match(/.{1,8}/g)?.join(' ') || bin;
      
      return (
          <div className="font-mono text-xs space-y-1 mt-2 bg-black/50 p-2 rounded border border-white/10">
              <div className="flex justify-between text-gray-500 mb-1"><span>Binary Match Analysis</span> <span className="text-neon-blue">/{option.cidr}</span></div>
              <div className="flex gap-1">
                  <span className="text-gray-400 w-8">DST:</span>
                  <span className="tracking-wider">
                      <span className="text-neon-green">{formatBin(destBin.substring(0, option.cidr))}</span>
                      <span className="text-gray-600">{formatBin(destBin.substring(option.cidr))}</span>
                  </span>
              </div>
              <div className="flex gap-1">
                  <span className="text-gray-400 w-8">NET:</span>
                  <span className="tracking-wider">
                      <span className="text-neon-green">{formatBin(netBin.substring(0, option.cidr))}</span>
                      <span className="text-gray-600">{formatBin(netBin.substring(option.cidr))}</span>
                  </span>
              </div>
          </div>
      );
  };

  if (hops.length === 0) return <div className="text-center pt-20 animate-pulse">Initializing Network Topology...</div>;
  const currentHop = hops[currentHopIndex];

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 preserve-3d h-full pt-12">
      {/* Header */}
      <div className="mb-8 text-center preserve-3d relative z-10 w-full">
        <div className="flex items-center justify-center gap-3 mb-2">
            <Globe className="text-neon-blue animate-spin-slow" />
            <h2 className="text-4xl font-mono font-bold text-neon-blue" style={{ textShadow: '0 0 20px rgba(0,243,255,0.6)' }}>Packet Tracer</h2>
        </div>
        
        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2 text-gray-400 bg-black/40 px-4 py-1 rounded-full border border-white/10">
                <Clock size={14} className={ttl < 10 ? "text-red-500 animate-pulse" : "text-neon-blue"} />
                <span className="text-sm font-mono font-bold">TTL: {ttl}</span>
            </div>
             <div className="flex items-center gap-2 text-gray-400 bg-black/40 px-4 py-1 rounded-full border border-white/10">
                <Activity size={14} className={integrity < 30 ? "text-red-500 animate-pulse" : "text-neon-green"} />
                <span className="text-sm font-mono font-bold">Integrity: {Math.floor(integrity)}%</span>
            </div>
        </div>

        {hasTimeDilation && (
            <div className="inline-flex items-center gap-1 mt-2 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30 animate-fade-in">
                <Clock size={12} /> TIME DILATION ACTIVE
            </div>
        )}
      </div>

      {/* Game Container */}
      <div className="w-full max-w-5xl bg-black/80 backdrop-blur-xl rounded-3xl border border-neon-blue/20 shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-visible preserve-3d relative min-h-[600px] flex flex-col">
        
        {/* Top Info Bar */}
        <div className="bg-gray-900/90 p-4 rounded-t-3xl border-b border-gray-700 flex flex-col md:flex-row justify-between items-center relative z-20 gap-4">
            <div className="flex items-center gap-4 flex-1">
                <div className="bg-neon-blue/10 p-2 rounded border border-neon-blue/30 flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[10px] text-neon-blue uppercase font-bold">Target IP</div>
                        <div className="text-xl font-mono text-white font-bold tracking-wider">{packetDest}</div>
                    </div>
                    <Globe className="text-neon-blue opacity-50" />
                </div>
                
                {/* Hop Log */}
                <div className="hidden md:flex items-center gap-2 overflow-x-auto scrollbar-hide mask-linear-fade flex-1 px-4">
                    {hopLog.map((hop, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                            <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">{hop}</span>
                            {i < hopLog.length && <span className="text-gray-700">→</span>}
                        </div>
                    ))}
                    <span className="text-neon-blue animate-pulse">...</span>
                </div>
            </div>
            {gameState === 'planning' && !hint && (
                <button onClick={getAIHint} className="text-neon-blue hover:text-white text-sm flex items-center gap-1"><HelpCircle size={14}/> Hint</button>
            )}
        </div>

        {/* Visual Playground */}
        <div className="flex-1 relative flex flex-col items-center justify-start p-8 preserve-3d overflow-visible">
            
            {/* SVG Cable Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="cableGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00f3ff" stopOpacity="1" />
                        <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Draw lines from center top (Router) to bottom 3 points (Options) */}
                {/* Assuming desktop layout roughly */}
                <path d="M 50% 180 L 16% 100%" stroke="url(#cableGradient)" strokeWidth="2" fill="none" className="animate-pulse-slow" />
                <path d="M 50% 180 L 50% 100%" stroke="url(#cableGradient)" strokeWidth="2" fill="none" className="animate-pulse-slow" style={{animationDelay: '0.5s'}} />
                <path d="M 50% 180 L 84% 100%" stroke="url(#cableGradient)" strokeWidth="2" fill="none" className="animate-pulse-slow" style={{animationDelay: '1s'}} />
            </svg>

            {/* Hover Analysis Tooltip */}
            {hoveredOption && gameState === 'planning' && (
                <div className="absolute top-4 right-4 md:right-10 z-50 w-72 bg-black/90 border border-neon-green/50 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,0,0.2)] backdrop-blur-md animate-fade-in pointer-events-none">
                    <div className="flex items-center gap-2 text-neon-green mb-2 pb-2 border-b border-gray-700">
                        <Microscope size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Route Analysis</span>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase">CIDR Block</div>
                            <div className="text-white font-mono font-bold">/{hoveredOption.cidr}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase">IP Range</div>
                            <div className="text-neon-blue font-mono text-xs">{getUsableRange(hoveredOption.network, hoveredOption.cidr)}</div>
                        </div>
                        {renderBinaryComparison(hoveredOption)}
                        
                        {/* Match Status Indicator */}
                        <div className={`mt-2 text-xs font-bold flex items-center gap-1 ${hoveredOption.isCorrect ? 'text-neon-green' : 'text-red-500'}`}>
                             <Scan size={12} /> {hoveredOption.isCorrect ? 'PREFIX MATCH CONFIRMED' : 'PREFIX MISMATCH DETECTED'}
                        </div>
                    </div>
                </div>
            )}

            {/* Source Node */}
            <div className="relative z-10 mb-12 transform transition-transform duration-500 preserve-3d mt-10">
                <div className="w-32 h-32 bg-gray-800 rounded-xl border-2 border-gray-600 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative z-20">
                     
                     {/* Flying Packet Animation */}
                     <div 
                        className={`absolute z-50 w-12 h-12 bg-neon-blue rounded-lg shadow-[0_0_20px_#00f3ff] flex items-center justify-center font-bold text-xs text-black border border-white pointer-events-none
                            ${gameState === 'moving' ? 'opacity-100' : 'opacity-0'}
                        `}
                        style={{ 
                            transitionDuration: `${animationDuration}ms`,
                            transitionProperty: 'transform, opacity, scale',
                            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: getPacketTransform(),
                            opacity: gameState === 'moving' ? 1 : 0
                        }}
                     >
                        <Package size={20} />
                     </div>

                     <Router size={48} className="text-gray-400 mb-2" />
                     <div className="text-xs font-mono text-gray-500 bg-black/50 px-2 rounded">{currentHop.routerName}</div>
                </div>
            </div>

            {/* Options (Next Hops) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-20 mt-auto mb-10 px-4">
                {currentHop.options.map((option, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    const isMoving = gameState === 'moving';
                    const isFailure = gameState === 'failure';
                    const isSuccess = gameState === 'success';

                    return (
                        <button
                            key={option.id}
                            onMouseEnter={() => setHoveredOption(option)}
                            onMouseLeave={() => setHoveredOption(null)}
                            onClick={() => handleRouteSelect(option, idx)}
                            disabled={gameState !== 'planning'}
                            className={`
                                group relative p-6 rounded-xl border-2 bg-black/60 backdrop-blur-md text-left transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl preserve-3d active:scale-95
                                ${isFailure && !option.isCorrect && isSelected ? 'border-red-500 bg-red-900/20 opacity-80' : ''}
                                ${isFailure && !option.isCorrect && !isSelected ? 'opacity-30 grayscale' : ''}
                                ${isSuccess && option.isCorrect ? 'border-neon-green bg-neon-green/20 shadow-[0_0_30px_#0aff0a]' : ''}
                                ${!isFailure && !isSuccess ? 'border-gray-700 hover:border-neon-blue' : ''}
                            `}
                        >
                            {/* Cable Visuals (CSS Fallback) */}
                            <div className={`
                                absolute -top-10 left-1/2 -translate-x-1/2 w-1 h-10 transition-colors duration-500
                                ${isSelected && isMoving ? 'bg-neon-blue shadow-[0_0_10px_#00f3ff] animate-pulse' : ''}
                                ${isSuccess && option.isCorrect ? 'bg-neon-green shadow-[0_0_15px_#0aff0a]' : 'bg-gradient-to-b from-gray-800 to-gray-700 group-hover:to-neon-blue'}
                                ${isFailure && isSelected ? 'bg-red-500' : ''}
                            `}></div>
                            
                            <div className={`
                                absolute -top-12 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border transition-all duration-300
                                ${isSelected && isMoving ? 'bg-neon-blue border-white scale-125 shadow-[0_0_15px_#00f3ff]' : 'bg-gray-800 border-gray-600 group-hover:border-neon-blue group-hover:bg-neon-blue'}
                                ${isSuccess && option.isCorrect ? 'bg-neon-green border-white' : ''}
                                ${isFailure && isSelected ? 'bg-red-500 border-red-500' : ''}
                            `}></div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Interface eth{idx}</span>
                                <span className={`text-lg font-mono font-bold transition-colors ${isSelected && isMoving ? 'text-neon-blue' : 'text-white group-hover:text-neon-blue'}`}>
                                    {option.network}
                                </span>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-mono text-neon-purple bg-neon-purple/10 px-2 rounded">/{option.cidr}</span>
                                    {gameState === 'planning' && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 flex items-center gap-1">
                                            <Microscope size={12} /> ANALYZE
                                        </div>
                                    )}
                                    {gameState === 'moving' && isSelected && (
                                        <div className="text-xs text-neon-blue animate-pulse flex items-center gap-1"><ArrowDown size={12}/> ROUTING</div>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* End Game States */}
            {gameState === 'success' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in rounded-3xl">
                    <div className="text-center p-8 bg-neon-card border border-neon-green rounded-2xl shadow-[0_0_50px_rgba(10,255,10,0.3)] animate-pop">
                        <CheckCircle size={64} className="text-neon-green mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-2">Packet Delivered!</h3>
                        <p className="text-gray-400 mb-6">Route confirmed. Latency minimal.</p>
                        <button onClick={nextLevel} className="px-8 py-3 bg-neon-green text-black font-bold rounded-full hover:scale-105 transition-transform">
                            Next Batch (Level {level + 1})
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'failure' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in rounded-3xl">
                    <div className="text-center p-8 bg-neon-card border border-red-500 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-shake">
                        <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-white mb-2">Connection Lost</h3>
                        <p className="text-red-300 mb-6 font-mono max-w-md">{feedback}</p>
                        <button onClick={retryLevel} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-transform">
                            Re-Initialize Route
                        </button>
                    </div>
                </div>
            )}

            {/* AI Hint Overlay */}
            {hint && gameState === 'planning' && (
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 border border-neon-blue/50 p-4 rounded-xl max-w-lg w-full animate-fade-in-up z-40 shadow-2xl">
                     <div className="flex gap-3">
                         <div className="min-w-[24px]"><HelpCircle className="text-neon-blue" /></div>
                         <p className="text-sm text-gray-300">{hint}</p>
                     </div>
                 </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default PacketTracerGame;
