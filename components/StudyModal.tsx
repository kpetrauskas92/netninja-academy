import React, { useState } from 'react';
import { X, BookOpen, Table, Hash, Network } from 'lucide-react';

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudyModal: React.FC<StudyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'binary' | 'hex' | 'subnet'>('binary');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-neon-card border border-neon-blue/30 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-neon-dark/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <BookOpen className="text-neon-blue" size={24} />
            <h2 className="text-2xl font-bold text-white font-mono">NetNinja Field Manual</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button 
            onClick={() => setActiveTab('binary')}
            className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${activeTab === 'binary' ? 'bg-neon-blue/10 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Binary Basics
          </button>
          <button 
            onClick={() => setActiveTab('hex')}
            className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${activeTab === 'hex' ? 'bg-neon-purple/10 text-neon-purple border-b-2 border-neon-purple' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Hexadecimal
          </button>
          <button 
            onClick={() => setActiveTab('subnet')}
            className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${activeTab === 'subnet' ? 'bg-neon-green/10 text-neon-green border-b-2 border-neon-green' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Subnetting
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {activeTab === 'binary' && (
            <div className="space-y-8 animate-fade-in">
              <section>
                <h3 className="text-xl font-bold text-neon-blue mb-4">The Power of Two</h3>
                <p className="text-gray-300 mb-4">Computers only understand on (1) and off (0). In an 8-bit system, each position represents a power of 2. To get a number, you just add up the values where the bit is "1".</p>
                <div className="grid grid-cols-8 gap-2 text-center mb-4">
                  {['128', '64', '32', '16', '8', '4', '2', '1'].map((val, i) => (
                    <div key={i} className="bg-gray-800 p-3 rounded border border-gray-700">
                      <div className="text-xs text-gray-500 mb-1">2^{7-i}</div>
                      <div className="text-neon-blue font-bold text-lg">{val}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-black/40 p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-2">Example: Creating 150</h3>
                <div className="font-mono text-gray-300">
                  <div className="flex gap-2 text-xl mb-2">
                    <span className="text-green-400">1</span>
                    <span className="text-gray-600">0</span>
                    <span className="text-gray-600">0</span>
                    <span className="text-green-400">1</span>
                    <span className="text-green-400">0</span>
                    <span className="text-green-400">1</span>
                    <span className="text-green-400">1</span>
                    <span className="text-gray-600">0</span>
                  </div>
                  <p>128 + 0 + 0 + 16 + 0 + 4 + 2 + 0 = <span className="text-neon-blue font-bold">150</span></p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'hex' && (
            <div className="space-y-8 animate-fade-in">
               <section>
                <h3 className="text-xl font-bold text-neon-purple mb-4">Base-16 System</h3>
                <p className="text-gray-300 mb-6">Hexadecimal is a compact way to write binary. Each Hex digit represents exactly 4 bits (a "nibble").</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-500 text-xs uppercase">
                        <th className="p-2">Dec</th>
                        <th className="p-2">Hex</th>
                        <th className="p-2">Binary</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {Array.from({length: 8}).map((_, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-white/5">
                          <td className="p-2 text-gray-400">{i}</td>
                          <td className="p-2 text-neon-purple font-bold">{i.toString(16).toUpperCase()}</td>
                          <td className="p-2 text-gray-500">{i.toString(2).padStart(4, '0')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-gray-700 text-gray-500 text-xs uppercase">
                        <th className="p-2">Dec</th>
                        <th className="p-2">Hex</th>
                        <th className="p-2">Binary</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {Array.from({length: 8}).map((_, i) => {
                        const val = i + 8;
                        return (
                        <tr key={val} className="border-b border-gray-800 hover:bg-white/5">
                          <td className="p-2 text-gray-400">{val}</td>
                          <td className="p-2 text-neon-purple font-bold">{val.toString(16).toUpperCase()}</td>
                          <td className="p-2 text-gray-500">{val.toString(2).padStart(4, '0')}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'subnet' && (
             <div className="space-y-8 animate-fade-in">
                <section>
                  <h3 className="text-xl font-bold text-neon-green mb-4">Understanding CIDR</h3>
                  <p className="text-gray-300 mb-4">The slash notation (e.g., /24) tells you how many bits are set to "1" in the subnet mask. The rest are "0" and used for hosts.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-500 uppercase">
                        <tr>
                          <th className="p-3">CIDR</th>
                          <th className="p-3">Subnet Mask</th>
                          <th className="p-3">Total IPs</th>
                          <th className="p-3">Usable Hosts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 font-mono">
                         <tr className="hover:bg-white/5">
                            <td className="p-3 text-neon-green">/24</td>
                            <td className="p-3">255.255.255.0</td>
                            <td className="p-3">256</td>
                            <td className="p-3">254</td>
                         </tr>
                         <tr className="hover:bg-white/5">
                            <td className="p-3 text-neon-green">/25</td>
                            <td className="p-3">255.255.255.128</td>
                            <td className="p-3">128</td>
                            <td className="p-3">126</td>
                         </tr>
                         <tr className="hover:bg-white/5">
                            <td className="p-3 text-neon-green">/26</td>
                            <td className="p-3">255.255.255.192</td>
                            <td className="p-3">64</td>
                            <td className="p-3">62</td>
                         </tr>
                         <tr className="hover:bg-white/5">
                            <td className="p-3 text-neon-green">/27</td>
                            <td className="p-3">255.255.255.224</td>
                            <td className="p-3">32</td>
                            <td className="p-3">30</td>
                         </tr>
                         <tr className="hover:bg-white/5">
                            <td className="p-3 text-neon-green">/28</td>
                            <td className="p-3">255.255.255.240</td>
                            <td className="p-3">16</td>
                            <td className="p-3">14</td>
                         </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h4 className="text-white font-bold mb-2">Important Addresses</h4>
                    <ul className="list-disc list-inside text-gray-400 space-y-2">
                        <li><span className="text-neon-green font-bold">Network Address:</span> The first IP in the block (Host portion is all 0s). Cannot be assigned to a device.</li>
                        <li><span className="text-neon-green font-bold">Broadcast Address:</span> The last IP in the block (Host portion is all 1s). Used to talk to everyone.</li>
                    </ul>
                </section>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudyModal;