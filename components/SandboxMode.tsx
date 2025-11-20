
import React, { useState, useEffect } from 'react';
import { Cpu, Network, Palette, Sliders, RefreshCw, Copy, Eye } from 'lucide-react';

interface SandboxModeProps {
  onExit: () => void;
}

const SandboxMode: React.FC<SandboxModeProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'binary' | 'subnet' | 'hex'>('binary');

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 pt-12 h-full preserve-3d">
       {/* Header */}
       <div className="mb-8 flex justify-between items-end w-full preserve-3d border-b border-white/10 pb-4">
        <div>
            <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sliders className="text-neon-green" size={40} /> Sandbox Mode
            </h2>
            <p className="text-gray-400">Experimental playgrounds. No score, no pressure.</p>
        </div>
        <button onClick={onExit} className="text-gray-500 hover:text-white underline">Exit Sandbox</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 preserve-3d w-full justify-center">
          <button 
            onClick={() => setActiveTab('binary')} 
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === 'binary' ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Cpu size={18} /> 32-Bit Binary
          </button>
          <button 
            onClick={() => setActiveTab('subnet')} 
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === 'subnet' ? 'bg-neon-green text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Network size={18} /> Subnet Calc
          </button>
          <button 
            onClick={() => setActiveTab('hex')} 
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === 'hex' ? 'bg-neon-pink text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Palette size={18} /> Color Hex
          </button>
      </div>

      {/* Content Area */}
      <div className="w-full bg-black/60 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl preserve-3d min-h-[500px]">
          {activeTab === 'binary' && <BinarySandbox />}
          {activeTab === 'subnet' && <SubnetSandbox />}
          {activeTab === 'hex' && <HexSandbox />}
      </div>
    </div>
  );
};

// --- 1. Binary Sandbox ---
const BinarySandbox = () => {
    const [bits, setBits] = useState<number[]>(new Array(32).fill(0));

    const toggleBit = (index: number) => {
        const newBits = [...bits];
        newBits[index] = newBits[index] === 0 ? 1 : 0;
        setBits(newBits);
    };

    const getIntValue = () => {
        return bits.reduce((acc, bit, idx) => acc + (bit * Math.pow(2, 31 - idx)), 0);
    };

    const getDottedDecimal = () => {
        const octets = [];
        for(let i=0; i<32; i+=8) {
            const slice = bits.slice(i, i+8);
            const val = slice.reduce((acc, bit, idx) => acc + (bit * Math.pow(2, 7 - idx)), 0);
            octets.push(val);
        }
        return octets.join('.');
    };

    return (
        <div className="flex flex-col items-center gap-8 animate-fade-in">
            <div className="text-center">
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-2">Unsigned 32-bit Integer</div>
                <div className="text-5xl font-mono font-bold text-neon-blue mb-4">{getIntValue().toLocaleString()}</div>
                <div className="text-xl font-mono text-gray-400 bg-black/40 px-4 py-2 rounded border border-white/5 inline-block">
                    IP Format: <span className="text-white">{getDottedDecimal()}</span>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
                {/* Render 4 Octets */}
                {[0, 1, 2, 3].map(octetIdx => (
                    <div key={octetIdx} className="flex gap-1 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                        {Array.from({length: 8}).map((_, bitIdx) => {
                            const globalIndex = (octetIdx * 8) + bitIdx;
                            const bit = bits[globalIndex];
                            const power = 31 - globalIndex;
                            return (
                                <button 
                                    key={globalIndex}
                                    onClick={() => toggleBit(globalIndex)}
                                    className={`w-8 h-16 rounded flex flex-col items-center justify-between py-1 transition-all hover:scale-110 ${bit ? 'bg-neon-blue text-black shadow-[0_0_10px_#00f3ff]' : 'bg-gray-800 text-gray-600 hover:bg-gray-700'}`}
                                    title={`2^${power} = ${Math.pow(2, power).toLocaleString()}`}
                                >
                                    <span className="font-bold">{bit}</span>
                                    <span className="text-[8px] opacity-50">{globalIndex % 8 === 7 ? 1 : ''}</span>
                                </button>
                            )
                        })}
                        <div className="absolute -top-3 left-2 text-[10px] text-gray-500">Octet {octetIdx + 1}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4">
                <button onClick={() => setBits(new Array(32).fill(0))} className="px-4 py-2 rounded bg-gray-800 text-gray-400 hover:text-white">Clear All</button>
                <button onClick={() => setBits(new Array(32).fill(1))} className="px-4 py-2 rounded bg-gray-800 text-gray-400 hover:text-white">Set All</button>
            </div>
        </div>
    );
};

// --- 2. Subnet Sandbox ---
const SubnetSandbox = () => {
    const [ipInput, setIpInput] = useState('192.168.1.10');
    const [cidr, setCidr] = useState(24);

    const ipToInt = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const intToIp = (int: number) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
    
    // Calculate all stats
    const maskInt = ~((1 << (32 - cidr)) - 1) >>> 0;
    const wildcardInt = ~maskInt >>> 0;
    
    let ipInt = 0;
    let isValid = false;
    
    try {
        if (ipInput.split('.').length === 4 && ipInput.split('.').every(o => !isNaN(parseInt(o)) && parseInt(o) >= 0 && parseInt(o) <= 255)) {
             ipInt = ipToInt(ipInput);
             isValid = true;
        }
    } catch (e) {}

    const networkInt = ipInt & maskInt;
    const broadcastInt = networkInt | wildcardInt;
    const firstHostInt = networkInt + 1;
    const lastHostInt = broadcastInt - 1;
    const totalHosts = Math.max(0, Math.pow(2, 32 - cidr) - 2);

    const intToBinaryStr = (int: number) => (int >>> 0).toString(2).padStart(32, '0').match(/.{1,8}/g)?.join('.') || '';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
             {/* Controls */}
             <div className="space-y-6">
                 <div>
                     <label className="block text-sm text-gray-500 uppercase mb-2">IP Address</label>
                     <input 
                        type="text" 
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        className="w-full bg-black/50 border border-gray-600 rounded-lg p-4 text-xl font-mono text-white focus:border-neon-green focus:outline-none"
                     />
                 </div>
                 <div>
                     <label className="block text-sm text-gray-500 uppercase mb-2 flex justify-between">
                        <span>Subnet Mask (CIDR)</span>
                        <span className="text-neon-green">/{cidr}</span>
                     </label>
                     <input 
                        type="range" 
                        min="1" max="30" 
                        value={cidr}
                        onChange={(e) => setCidr(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                     />
                     <div className="text-right text-xs text-gray-500 mt-1 font-mono">{intToIp(maskInt)}</div>
                 </div>

                 {/* Binary Viz */}
                 {isValid && (
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-sm space-y-2 overflow-x-auto">
                        <div className="flex justify-between"><span className="text-gray-500">IP:</span> <span className="text-gray-300">{intToBinaryStr(ipInt)}</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-2"><span className="text-gray-500">Mask:</span> <span className="text-neon-green">{intToBinaryStr(maskInt)}</span></div>
                        <div className="flex justify-between pt-2"><span className="text-gray-500">Net:</span> <span className="text-neon-blue">{intToBinaryStr(networkInt)}</span></div>
                    </div>
                 )}
             </div>

             {/* Results */}
             <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700 shadow-inner">
                 <h3 className="text-neon-green font-bold text-lg mb-4 flex items-center gap-2"><Network size={20}/> Network Analysis</h3>
                 
                 <div className="space-y-4 font-mono">
                    <ResultRow label="Network Address" value={isValid ? intToIp(networkInt) : '-'} />
                    <ResultRow label="Broadcast Address" value={isValid ? intToIp(broadcastInt) : '-'} />
                    <div className="h-px bg-gray-700 my-2"></div>
                    <ResultRow label="First Host" value={isValid ? intToIp(firstHostInt) : '-'} />
                    <ResultRow label="Last Host" value={isValid ? intToIp(lastHostInt) : '-'} />
                    <div className="h-px bg-gray-700 my-2"></div>
                    <ResultRow label="Usable Hosts" value={isValid ? totalHosts.toLocaleString() : '-'} highlight />
                    <ResultRow label="Wildcard Mask" value={isValid ? intToIp(wildcardInt) : '-'} />
                 </div>
             </div>
        </div>
    );
};

const ResultRow = ({label, value, highlight}: {label: string, value: string, highlight?: boolean}) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className={`font-bold text-lg ${highlight ? 'text-neon-green' : 'text-white'}`}>{value}</span>
    </div>
);

// --- 3. Hex Sandbox ---
const HexSandbox = () => {
    const [hex, setHex] = useState('00F3FF');
    const [r, setR] = useState(0);
    const [g, setG] = useState(243);
    const [b, setB] = useState(255);

    // Sync from Hex to RGB
    const handleHexChange = (val: string) => {
        const clean = val.replace('#', '').toUpperCase();
        if (clean.length <= 6 && /^[0-9A-F]*$/.test(clean)) {
            setHex(clean);
            if (clean.length === 6) {
                setR(parseInt(clean.substring(0,2), 16));
                setG(parseInt(clean.substring(2,4), 16));
                setB(parseInt(clean.substring(4,6), 16));
            }
        }
    };

    // Sync from RGB to Hex
    useEffect(() => {
        const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
        setHex(`${toHex(r)}${toHex(g)}${toHex(b)}`);
    }, [r, g, b]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-fade-in">
            
            {/* Controls */}
            <div className="space-y-8">
                {/* Hex Input */}
                <div>
                     <label className="block text-sm text-gray-500 uppercase mb-2">Hex Code</label>
                     <div className="flex items-center gap-2 bg-black/50 border border-gray-600 rounded-lg p-4 focus-within:border-neon-pink transition-colors">
                        <span className="text-gray-500 text-2xl font-mono">#</span>
                        <input 
                            type="text" 
                            value={hex}
                            onChange={(e) => handleHexChange(e.target.value)}
                            className="w-full bg-transparent text-3xl font-mono font-bold text-white focus:outline-none uppercase"
                            maxLength={6}
                        />
                     </div>
                </div>

                {/* Sliders */}
                <div className="space-y-6 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                    <ColorSlider label="Red" val={r} setVal={setR} color="text-red-500" track="accent-red-500" />
                    <ColorSlider label="Green" val={g} setVal={setG} color="text-green-500" track="accent-green-500" />
                    <ColorSlider label="Blue" val={b} setVal={setB} color="text-blue-500" track="accent-blue-500" />
                </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center">
                 <div 
                    className="w-64 h-64 rounded-full shadow-[0_0_60px_rgba(0,0,0,0.5)] border-4 border-white/20 relative mb-6 transition-all duration-200"
                    style={{ backgroundColor: `#${hex}`, boxShadow: `0 0 40px #${hex}` }}
                 >
                     {/* Glare effect */}
                     <div className="absolute top-4 left-8 w-20 h-10 bg-white/20 rounded-full rotate-[-45deg] blur-md"></div>
                 </div>
                 
                 <div className="text-center space-y-1">
                     <div className="text-gray-500 text-xs uppercase tracking-widest">RGB Values</div>
                     <div className="font-mono text-xl text-white">rgb({r}, {g}, {b})</div>
                 </div>
            </div>
        </div>
    );
};

const ColorSlider = ({label, val, setVal, color, track}: any) => (
    <div>
        <div className="flex justify-between mb-2">
            <span className={`font-bold ${color}`}>{label}</span>
            <span className="font-mono text-gray-400">{val} <span className="text-xs text-gray-600">(0x{val.toString(16).toUpperCase().padStart(2,'0')})</span></span>
        </div>
        <input 
            type="range" min="0" max="255" 
            value={val} 
            onChange={(e) => setVal(parseInt(e.target.value))}
            className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${track}`}
        />
    </div>
);

export default SandboxMode;
