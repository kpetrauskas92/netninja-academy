
import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Pause, Play, Search, Flag, FileText, Filter, CheckCircle, AlertTriangle, ArrowDown, Activity, Lock, Globe } from 'lucide-react';

interface PacketSnifferGameProps {
  addXP: (amount: number) => void;
}

interface Packet {
  id: number;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'DNS' | 'FTP';
  length: number;
  payload: string; // Raw content
  isTarget?: boolean; // If this is the packet we are looking for
}

interface Mission {
  id: number;
  title: string;
  description: string;
  criteria: (p: Packet) => boolean;
  hint: string;
  xpReward: number;
}

const PacketSnifferGame: React.FC<PacketSnifferGameProps> = ({ addXP }) => {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'HTTP' | 'DNS' | 'TCP'>('ALL');
  const [mission, setMission] = useState<Mission | null>(null);
  const [feedback, setFeedback] = useState<{type: 'success'|'fail', msg: string} | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const packetIdCounter = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // --- Generators ---

  const generateRandomIp = () => `192.168.${Math.floor(Math.random()*10)}.${Math.floor(Math.random()*254+1)}`;
  const generatePublicIp = () => `${Math.floor(Math.random()*200+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
  
  const generatePayload = (proto: string, isTarget = false) => {
      if (isTarget) {
          // Specific payloads for missions
          if (proto === 'HTTP') return "POST /login HTTP/1.1\nHost: bank.com\nUser=admin&pass=hunter2";
          if (proto === 'DNS') return "Standard query 0x1a2b A c2-server-malware.xyz";
          if (proto === 'FTP') return "USER root\nPASS toor\n230 Login successful.";
      }

      // Noise payloads
      if (proto === 'HTTP') {
          const paths = ['/index.html', '/style.css', '/api/v1/status', '/images/logo.png'];
          return `GET ${paths[Math.floor(Math.random()*paths.length)]} HTTP/1.1\nHost: internal-server`;
      }
      if (proto === 'DNS') {
          const domains = ['google.com', 'netflix.com', 'slack.com', 'api.github.com'];
          return `Standard query 0x${Math.floor(Math.random()*9999).toString(16)} A ${domains[Math.floor(Math.random()*domains.length)]}`;
      }
      if (proto === 'TCP') return `[SYN] Seq=${Math.floor(Math.random()*1000)} Win=${Math.floor(Math.random()*65535)} Len=0`;
      if (proto === 'UDP') return `Len=${Math.floor(Math.random()*100)}`;
      return "Encrypted Data...";
  };

  const createPacket = (forceTarget = false): Packet => {
      packetIdCounter.current++;
      const protocols = ['TCP', 'TCP', 'UDP', 'HTTP', 'HTTP', 'DNS'];
      const proto = forceTarget 
        ? (mission?.title.includes('Password') ? 'HTTP' : mission?.title.includes('Malware') ? 'DNS' : 'FTP') 
        : protocols[Math.floor(Math.random() * protocols.length)] as any;

      const payload = generatePayload(proto, forceTarget);
      
      return {
          id: packetIdCounter.current,
          timestamp: new Date().toISOString().split('T')[1].slice(0,8),
          srcIp: generateRandomIp(),
          dstIp: generatePublicIp(),
          protocol: proto,
          length: Math.floor(Math.random() * 1000 + 60),
          payload: payload,
          isTarget: forceTarget
      };
  };

  // --- Game Logic ---

  const startMission = () => {
      const missions: Mission[] = [
          {
              id: 1,
              title: "Plaintext Credentials",
              description: "A user is logging into an unencrypted website. Find the HTTP POST request containing the password.",
              criteria: (p) => p.protocol === 'HTTP' && p.payload.includes('pass='),
              hint: "Filter for HTTP. Look for POST requests in the payload inspection.",
              xpReward: 150
          },
          {
              id: 2,
              title: "C2 Beacon",
              description: "A compromised host is querying a known malware domain. Find the suspicious DNS request.",
              criteria: (p) => p.protocol === 'DNS' && p.payload.includes('malware'),
              hint: "Filter for DNS. Check for domains that look suspicious.",
              xpReward: 200
          }
      ];
      
      const newMission = missions[Math.floor(Math.random() * missions.length)];
      setMission(newMission);
      setPackets([]);
      setSelectedPacket(null);
      setFeedback(null);
      packetIdCounter.current = 0;
      setIsCapturing(true);
  };

  useEffect(() => {
      startMission();
  }, []);

  useEffect(() => {
      if (isCapturing) {
          intervalRef.current = window.setInterval(() => {
              setPackets(prev => {
                  const shouldSpawnTarget = mission && !prev.some(p => p.isTarget) && Math.random() > 0.9;
                  const newPacket = createPacket(shouldSpawnTarget);
                  const list = [...prev, newPacket];
                  if (list.length > 50) list.shift(); // Keep memory low
                  return list;
              });
          }, 800); // Speed of traffic
      } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isCapturing, mission]);

  // Auto-scroll effect
  useEffect(() => {
      if (autoScroll && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [packets, autoScroll]);

  const handleFlagPacket = () => {
      if (!selectedPacket || !mission) return;

      if (mission.criteria(selectedPacket)) {
          setFeedback({ type: 'success', msg: "Suspicious Packet Captured! Analysis Confirmed." });
          setIsCapturing(false);
          addXP(mission.xpReward);
      } else {
          setFeedback({ type: 'fail', msg: "False Positive. This traffic appears legitimate." });
      }
  };

  const filteredPackets = filter === 'ALL' ? packets : packets.filter(p => p.protocol === filter);

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 pt-4 md:pt-12 h-full preserve-3d">
        {/* Header */}
        <div className="mb-6 text-center preserve-3d w-full">
             <h2 className="text-3xl md:text-5xl font-mono font-bold text-neon-blue mb-2 tracking-widest flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(0,243,255,0.6)' }}>
                <Wifi size={32} className="md:hidden" /><Wifi size={48} className="hidden md:block" /> PACKET SNIFFER
            </h2>
            <p className="text-gray-400 font-mono text-xs md:text-base">Intercept. Analyze. Identify.</p>
        </div>

        {/* Mission Briefing */}
        {mission && (
            <div className="w-full bg-black/40 border border-neon-blue/30 p-4 rounded-xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center backdrop-blur-md gap-4">
                <div>
                    <div className="text-xs text-neon-blue font-bold uppercase tracking-widest mb-1">Active Mission</div>
                    <div className="text-lg md:text-xl font-bold text-white">{mission.title}</div>
                    <div className="text-xs md:text-sm text-gray-400">{mission.description}</div>
                </div>
                <div className="text-right w-full md:w-auto border-t md:border-t-0 border-gray-700 pt-2 md:pt-0 mt-2 md:mt-0 flex md:block justify-between items-center">
                    <div className="text-xs text-gray-500 md:hidden">REWARD</div>
                    <div>
                        <div className="text-neon-green font-mono font-bold text-xl">{mission.xpReward} XP</div>
                        <div className="text-xs text-gray-500 hidden md:block">REWARD</div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 w-full h-[600px] preserve-3d">
            
            {/* Left: Packet List */}
            <div className="w-full md:w-2/3 flex flex-col bg-gray-900/90 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                {/* Toolbar */}
                <div className="p-3 bg-gray-800 border-b border-gray-700 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={() => setIsCapturing(!isCapturing)}
                            className={`p-2 rounded transition-colors ${isCapturing ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40' : 'bg-green-500/20 text-green-500 hover:bg-green-500/40'}`}
                            title={isCapturing ? "Stop Capture" : "Start Capture"}
                        >
                            {isCapturing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        <div className="h-6 w-px bg-gray-700 mx-1"></div>
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
                            {(['ALL', 'HTTP', 'DNS', 'TCP'] as const).map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-2 py-1 rounded text-[10px] md:text-xs font-bold transition-colors whitespace-nowrap ${filter === f ? 'bg-neon-blue text-black' : 'text-gray-400 hover:bg-gray-700'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /> <span className="hidden sm:inline">Auto-Scroll</span>
                        </label>
                        <span className="font-mono text-neon-blue">{packets.length} pkts</span>
                    </div>
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                         <div className="grid grid-cols-[50px_80px_1fr_1fr_60px_60px] bg-black text-gray-500 text-xs font-bold p-2 border-b border-gray-800 uppercase">
                            <div>No.</div>
                            <div>Time</div>
                            <div>Source</div>
                            <div>Destination</div>
                            <div>Proto</div>
                            <div>Len</div>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono text-xs relative">
                     <div className="min-w-[500px]">
                        {filteredPackets.map((p, idx) => (
                            <div 
                                key={p.id}
                                onClick={() => { setSelectedPacket(p); setAutoScroll(false); }}
                                className={`
                                    grid grid-cols-[50px_80px_1fr_1fr_60px_60px] p-2 border-b border-gray-800 cursor-pointer transition-colors
                                    ${selectedPacket?.id === p.id ? 'bg-neon-blue/20 text-white' : 'text-gray-300 hover:bg-white/5'}
                                    ${p.protocol === 'HTTP' ? 'text-green-300' : p.protocol === 'DNS' ? 'text-blue-300' : p.protocol === 'TCP' ? 'text-gray-400' : 'text-yellow-300'}
                                `}
                            >
                                <div>{p.id}</div>
                                <div>{p.timestamp}</div>
                                <div className="truncate pr-2">{p.srcIp}</div>
                                <div className="truncate pr-2">{p.dstIp}</div>
                                <div className="font-bold">{p.protocol}</div>
                                <div>{p.length}</div>
                            </div>
                        ))}
                        {filteredPackets.length === 0 && <div className="p-8 text-center text-gray-500 italic">Waiting for traffic...</div>}
                     </div>
                </div>
            </div>

            {/* Right: Inspection Panel */}
            <div className={`w-full md:w-1/3 flex flex-col gap-4 ${!selectedPacket && 'hidden md:flex'}`}>
                <div className="bg-black/80 border border-gray-700 rounded-xl p-4 flex-1 flex flex-col shadow-2xl">
                    <div className="flex items-center gap-2 text-gray-400 border-b border-gray-700 pb-2 mb-4">
                        <Search size={16} /> 
                        <span className="text-xs font-bold uppercase tracking-widest">Packet Inspector</span>
                        <button className="ml-auto md:hidden text-gray-500" onClick={() => setSelectedPacket(null)}>Close</button>
                    </div>

                    {selectedPacket ? (
                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-4">
                            <div className="space-y-1">
                                <div className="text-gray-500 font-bold">Ethernet II</div>
                                <div className="pl-2 text-gray-400">Src: 00:1a:2b:3c:4d:5e</div>
                                <div className="pl-2 text-gray-400">Dst: ff:ff:ff:ff:ff:ff</div>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="text-gray-500 font-bold">Internet Protocol Version 4</div>
                                <div className="pl-2 text-gray-400">Src: {selectedPacket.srcIp}</div>
                                <div className="pl-2 text-gray-400">Dst: {selectedPacket.dstIp}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-gray-500 font-bold">{selectedPacket.protocol === 'HTTP' ? 'Hypertext Transfer Protocol' : 'Transmission Control Protocol'}</div>
                                <div className="pl-2 text-gray-400">Len: {selectedPacket.length}</div>
                            </div>

                            <div className="mt-4 bg-gray-900 p-3 rounded border border-gray-800">
                                <div className="text-gray-500 font-bold mb-2">Payload (ASCII)</div>
                                <pre className="text-neon-green whitespace-pre-wrap break-all">
                                    {selectedPacket.payload}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600 text-center p-4">
                            <div className="animate-pulse">Select a packet from the stream to analyze headers and payload.</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 border-t border-gray-700 pt-4">
                        <button 
                            onClick={handleFlagPacket}
                            disabled={!selectedPacket}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${selectedPacket ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                        >
                            <Flag size={18} /> FLAG SUSPICIOUS
                        </button>
                    </div>
                </div>
                
                {/* Feedback Area */}
                {feedback && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 animate-pop ${feedback.type === 'success' ? 'bg-neon-green/10 border-neon-green text-neon-green' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                        {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                        <div>
                            <div className="font-bold">{feedback.type === 'success' ? 'SUCCESS' : 'FAILURE'}</div>
                            <div className="text-xs opacity-80">{feedback.msg}</div>
                        </div>
                        {feedback.type === 'success' && (
                             <button onClick={startMission} className="ml-auto text-xs underline hover:text-white">Next Mission</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PacketSnifferGame;
