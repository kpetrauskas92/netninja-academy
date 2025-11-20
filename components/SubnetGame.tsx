
import React, { useState, useEffect } from 'react';
import { getSubnetBreakdown } from '../services/geminiService';
import { SubnetQuestion } from '../types';
import { Network, Check, AlertCircle, Eye, EyeOff, Terminal, Shield, Zap, List, Calculator, Target, Lightbulb } from 'lucide-react';

interface SubnetGameProps {
  addXP: (amount: number) => void;
}

type Difficulty = 'rookie' | 'elite';

const SubnetGame: React.FC<SubnetGameProps> = ({ addXP }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');
  const [question, setQuestion] = useState<SubnetQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);
  const [showBinary, setShowBinary] = useState(false);

  // --- Helpers ---
  const intToIp = (int: number) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
  const ipToInt = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  const intToBinaryIp = (int: number) => (int >>> 0).toString(2).padStart(32, '0').match(/.{1,8}/g)?.join('.') || '';
  const getMaskInt = (cidr: number) => ~((1 << (32 - cidr)) - 1) >>> 0;

  // --- Question Generation ---

  const generateOptions = (correct: string, type: string, context?: any): string[] => {
      const opts = new Set<string>();
      opts.add(correct);

      while (opts.size < 4) {
          let decoy = '';
          if (type === 'usable_count') {
              // Decoys: Powers of 2 close to the answer
              const n = Math.floor(Math.random() * 10) + 2; // 2^2 to 2^12
              decoy = (Math.pow(2, n) - 2).toString();
              if (Math.random() > 0.5) decoy = Math.pow(2, n).toString(); // Total IPs vs Usable
          } else if (type === 'cidr_to_mask') {
              // Decoys: Neighboring CIDR masks
              const dCidr = Math.min(30, Math.max(8, context.cidr + Math.floor(Math.random() * 5) - 2));
              decoy = intToIp(getMaskInt(dCidr));
          } else if (type === 'mask_to_cidr') {
              // Decoys: Neighboring CIDRs
              decoy = '/' + Math.min(30, Math.max(8, parseInt(correct.replace('/','')) + Math.floor(Math.random() * 5) - 2));
          } else {
              // IP-based decoys (Network/Broadcast)
              const ipInt = ipToInt(correct);
              decoy = intToIp(ipInt + Math.floor(Math.random() * 10) - 5);
          }
          
          if (decoy !== correct) opts.add(decoy);
      }
      return Array.from(opts).sort(() => Math.random() - 0.5);
  };

  const generateQuestion = () => {
    // Basic randoms
    const octet1 = 192;
    const octet2 = 168;
    const octet3 = Math.floor(Math.random() * 10);
    const octet4 = Math.floor(Math.random() * 255);
    const ip = `${octet1}.${octet2}.${octet3}.${octet4}`;
    
    let q: SubnetQuestion;

    if (difficulty === 'rookie') {
        // ROOKIE MODE: Concepts & Multiple Choice
        const modeRoll = Math.random();
        
        if (modeRoll < 0.33) {
            // 1. CIDR to Mask
            const cidr = Math.floor(Math.random() * (30 - 24) + 24); // /24 to /30
            const answer = intToIp(getMaskInt(cidr));
            q = {
                ip, cidr,
                questionType: 'cidr_to_mask',
                correctAnswer: answer,
                options: generateOptions(answer, 'cidr_to_mask', { cidr })
            };
        } else if (modeRoll < 0.66) {
            // 2. Mask to CIDR
            const cidr = Math.floor(Math.random() * (30 - 24) + 24);
            const mask = intToIp(getMaskInt(cidr));
            q = {
                ip: mask, // Display mask as the "IP" field or just context
                cidr,
                questionType: 'mask_to_cidr',
                correctAnswer: `/${cidr}`,
                options: generateOptions(`/${cidr}`, 'mask_to_cidr')
            };
        } else {
            // 3. Usable Hosts Count
            const cidr = Math.floor(Math.random() * (30 - 24) + 24);
            const count = Math.pow(2, 32 - cidr) - 2;
            q = {
                ip, cidr,
                questionType: 'usable_count',
                correctAnswer: count.toString(),
                options: generateOptions(count.toString(), 'usable_count')
            };
        }
    } else {
        // ELITE MODE: Calculations & Typing
        const cidrs = [24, 25, 26, 27, 28, 29, 30];
        const cidr = cidrs[Math.floor(Math.random() * cidrs.length)];
        const ipNum = ipToInt(ip);
        const mask = getMaskInt(cidr);
        const networkNum = ipNum & mask;
        const broadcastNum = networkNum | (~mask >>> 0);
        const firstHost = networkNum + 1;
        const lastHost = broadcastNum - 1;

        const typeRoll = Math.random();
        let qType: any = 'network';
        let answer = '';

        if (typeRoll < 0.25) { qType = 'network'; answer = intToIp(networkNum); }
        else if (typeRoll < 0.50) { qType = 'broadcast'; answer = intToIp(broadcastNum); }
        else if (typeRoll < 0.75) { qType = 'first_host'; answer = intToIp(firstHost); }
        else { qType = 'last_host'; answer = intToIp(lastHost); }

        q = { ip, cidr, questionType: qType, correctAnswer: answer };
    }

    setQuestion(q);
    setUserAnswer('');
    setFeedback(null);
    setHint('');
    setExplanation('');
    // Auto-show binary for elite, optional for rookie
    setShowBinary(difficulty === 'elite');
  };

  useEffect(() => { generateQuestion(); }, [difficulty]);

  // --- Handlers ---

  const getFriendlyExplanation = (q: SubnetQuestion) => {
      if (q.questionType === 'usable_count') {
          const hostBits = 32 - q.cidr;
          return `A /${q.cidr} mask leaves ${hostBits} bits for hosts. The formula is 2^${hostBits} - 2 (subtracting Network & Broadcast).`;
      }
      if (q.questionType === 'cidr_to_mask') {
          return `/${q.cidr} means the first ${q.cidr} bits are ON (1). Converting that binary to decimal gives ${q.correctAnswer}.`;
      }
      if (q.questionType === 'network') {
          return `The Network ID is found by setting all host bits to 0.`;
      }
      if (q.questionType === 'broadcast') {
          return `The Broadcast Address is found by setting all host bits to 1.`;
      }
      return `Correct! You successfully calculated the ${q.questionType} address based on the /${q.cidr} mask.`;
  };

  const handleAnswer = (ans: string) => {
      if (!question) return;
      const isCorrect = ans.trim() === question.correctAnswer;
      if (isCorrect) {
          setFeedback('correct');
          setExplanation(getFriendlyExplanation(question));
          addXP(difficulty === 'rookie' ? 50 : 125);
      } else {
          setFeedback('incorrect');
      }
  };

  const getQuestionTitle = () => {
      if (!question) return '';
      switch(question.questionType) {
          case 'cidr_to_mask': return `Subnet Mask for /${question.cidr}?`;
          case 'mask_to_cidr': return `CIDR Notation for ${question.ip}?`;
          case 'usable_count': return `Usable Hosts in /${question.cidr}?`;
          case 'network': return 'Network Address';
          case 'broadcast': return 'Broadcast Address';
          case 'first_host': return 'First Usable Host';
          case 'last_host': return 'Last Usable Host';
          default: return 'Calculate';
      }
  };

  const getAIHint = async () => {
    if (!question) return;
    setLoadingHint(true);
    const prompt = getQuestionTitle();
    const text = await getSubnetBreakdown(question.ip, question.cidr, prompt);
    setHint(text);
    setLoadingHint(false);
  };

  if (!question) return <div className="text-white text-center animate-pulse pt-20">Initializing Network Topology...</div>;

  // --- Visualizer Component ---
  const BinaryVisualizer = () => {
      const ipInt = ipToInt(question.ip);
      const maskInt = getMaskInt(question.cidr);
      
      const ipBinStr = (ipInt >>> 0).toString(2).padStart(32, '0');
      const maskBinStr = (maskInt >>> 0).toString(2).padStart(32, '0');

      const indices = Array.from({length: 32}, (_, i) => i);

      return (
          <div className="mt-6 w-full bg-black/80 rounded-xl border border-white/10 shadow-inner overflow-hidden animate-fade-in-up">
              <div className="overflow-x-auto p-4 scrollbar-hide">
                  <div className="min-w-max flex flex-col gap-2">
                      
                      {/* IP Row */}
                      <div className="grid grid-cols-[80px_1fr] gap-4 items-center">
                          <div className="text-[10px] text-gray-500 font-bold text-right uppercase tracking-wider">IP Binary</div>
                          <div className="flex gap-3 bg-black/40 px-3 py-2 rounded border border-white/5">
                              {[0, 1, 2, 3].map(octet => (
                                  <div key={octet} className="flex gap-[2px]">
                                      {indices.slice(octet*8, (octet+1)*8).map(idx => {
                                          const isNet = idx < question.cidr;
                                          return (
                                              <span key={idx} className={`w-[14px] text-center font-mono text-sm ${isNet ? 'text-neon-green font-bold' : 'text-neon-pink font-bold'}`}>
                                                  {ipBinStr[idx]}
                                              </span>
                                          )
                                      })}
                                      {octet < 3 && <span className="text-gray-600 text-sm mx-1">.</span>}
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Mask Row */}
                      <div className="grid grid-cols-[80px_1fr] gap-4 items-center">
                          <div className="text-[10px] text-gray-500 font-bold text-right uppercase tracking-wider">Mask Binary</div>
                          <div className="flex gap-3 bg-black/40 px-3 py-2 rounded border border-white/5">
                              {[0, 1, 2, 3].map(octet => (
                                  <div key={octet} className="flex gap-[2px]">
                                      {indices.slice(octet*8, (octet+1)*8).map(idx => {
                                          const bit = maskBinStr[idx];
                                          return (
                                              <span key={idx} className={`w-[14px] text-center font-mono text-sm ${bit === '1' ? 'text-neon-green/50' : 'text-neon-pink/50'}`}>
                                                  {bit}
                                              </span>
                                          )
                                      })}
                                      {octet < 3 && <span className="text-gray-600 text-sm mx-1">.</span>}
                                  </div>
                              ))}
                          </div>
                      </div>

                  </div>
              </div>
              
              {/* Legend */}
              <div className="bg-black/40 p-2 flex justify-center gap-6 text-[10px] uppercase tracking-widest text-gray-400 border-t border-white/5">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-neon-green rounded-full"></div> Network ({question.cidr} bits)</div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-neon-pink rounded-full"></div> Host ({32 - question.cidr} bits)</div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-4 preserve-3d h-full pt-12">
      {/* Header & Difficulty Switch */}
      <div className="mb-8 text-center preserve-3d w-full">
        <h2 className="text-5xl font-mono font-bold text-neon-green mb-4" style={{ textShadow: '0 0 20px rgba(10,255,10,0.6)' }}>Subnet Showdown</h2>
        
        <div className="flex justify-center gap-6">
             <button 
                onClick={() => setDifficulty('rookie')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${difficulty === 'rookie' ? 'bg-neon-green text-black border-neon-green shadow-[0_0_15px_rgba(10,255,10,0.4)]' : 'bg-black/40 text-gray-500 border-gray-700'}`}
             >
                 <Shield size={18} /> ROOKIE
             </button>
             <button 
                onClick={() => setDifficulty('elite')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${difficulty === 'elite' ? 'bg-neon-purple text-white border-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.4)]' : 'bg-black/40 text-gray-500 border-gray-700'}`}
             >
                 <Zap size={18} /> ELITE
             </button>
        </div>
      </div>

      <div className="bg-black/80 backdrop-blur-xl p-8 md:p-10 rounded-2xl border border-neon-green/30 shadow-[0_0_60px_rgba(10,255,10,0.1)] w-full max-w-3xl transform transition-transform hover:scale-[1.01] duration-500 preserve-3d">
        
        {/* Problem Info Card */}
        <div className="flex flex-col gap-4 mb-8 bg-gray-900/80 p-6 rounded-xl border border-gray-700 relative shadow-inner preserve-3d">
            
            <button 
                onClick={(e) => { e.stopPropagation(); setShowBinary(!showBinary); }}
                className="absolute top-4 right-4 z-50 text-gray-400 hover:text-neon-green transition-colors transform translate-z-10 p-2 bg-black/40 rounded-full border border-transparent hover:border-neon-green/50" 
                title="Toggle Visualizer"
            >
                {showBinary ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            <div className="flex items-center gap-4">
                <div className="p-3 bg-neon-green/10 rounded-lg text-neon-green border border-neon-green/30">
                    <Network size={32} />
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">Target Parameters</p>
                    <p className="text-3xl font-mono font-bold text-white">
                        {question.questionType === 'mask_to_cidr' ? 'Mask: ' : 'IP: '} 
                        {question.ip} 
                        {question.questionType !== 'mask_to_cidr' && <span className="text-neon-green"> /{question.cidr}</span>}
                    </p>
                </div>
            </div>
            
            {showBinary && <BinaryVisualizer />}
        </div>

        {/* Task & Input Area */}
        <div className="space-y-6 preserve-3d">
            <div className="text-center mb-4">
                 <h3 className="text-xl text-white font-bold flex items-center justify-center gap-2">
                     <Target className="text-neon-green" /> {getQuestionTitle()}
                 </h3>
            </div>

            {difficulty === 'rookie' && question.options ? (
                // ROOKIE: Multiple Choice Grid
                <div className="grid grid-cols-2 gap-4">
                    {question.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(opt)}
                            disabled={feedback === 'correct'}
                            className={`
                                p-6 rounded-xl border-2 font-mono text-lg font-bold transition-all hover:scale-105 shadow-lg
                                ${feedback === 'correct' && opt === question.correctAnswer ? 'bg-neon-green text-black border-neon-green' : ''}
                                ${feedback === 'incorrect' && opt !== question.correctAnswer ? 'opacity-50' : ''}
                                ${!feedback ? 'bg-black/40 border-gray-700 hover:border-neon-green text-white' : ''}
                            `}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            ) : (
                // ELITE: Terminal Input
                <div className="relative group">
                    <div className={`relative bg-black border rounded-lg p-1 flex items-center transition-all ${feedback === 'incorrect' ? 'border-red-500 animate-shake' : 'border-gray-800'}`}>
                        <div className="pl-4 text-neon-green"><Terminal size={20} /></div>
                        <input 
                            type="text" 
                            value={userAnswer}
                            onChange={(e) => { setUserAnswer(e.target.value); setFeedback(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userAnswer)}
                            placeholder="Enter calculated address..."
                            className="w-full bg-transparent p-4 text-xl font-mono text-white focus:outline-none placeholder-gray-700"
                        />
                    </div>
                    <button 
                        onClick={() => handleAnswer(userAnswer)}
                        disabled={feedback === 'correct'}
                        className={`w-full mt-4 py-4 rounded-lg font-bold text-lg uppercase tracking-widest transition-all shadow-lg ${feedback === 'correct' ? 'bg-neon-green text-black' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                        {feedback === 'correct' ? 'CONFIRMED' : 'EXECUTE'}
                    </button>
                </div>
            )}

            {/* Feedback & Controls */}
            <div className="min-h-[100px]">
                {feedback === 'incorrect' && (
                    <div className="bg-red-900/30 border border-red-500/50 p-3 rounded flex items-center gap-2 text-red-400 animate-shake mb-4">
                        <AlertCircle size={20}/> <span>Calculation Mismatch.</span>
                        {!hint && <button onClick={getAIHint} className="ml-auto text-xs underline hover:text-white bg-red-500/20 px-2 py-1 rounded">{loadingHint ? 'Scanning...' : 'Ask AI'}</button>}
                    </div>
                )}
                
                {hint && <div className="mb-4 text-sm text-gray-300 bg-black/40 p-4 rounded border-l-2 border-neon-green animate-fade-in font-mono leading-relaxed whitespace-pre-wrap">{hint}</div>}

                {feedback === 'correct' && (
                    <div className="animate-pop space-y-4">
                         
                         {explanation && (
                            <div className="bg-neon-green/10 border border-neon-green/30 p-4 rounded-xl flex items-start gap-3 text-left">
                                <Lightbulb className="text-neon-green shrink-0 mt-1" size={20} />
                                <div>
                                    <div className="text-xs font-bold text-neon-green uppercase mb-1">Logic Check</div>
                                    <div className="text-sm text-gray-200">{explanation}</div>
                                </div>
                            </div>
                         )}

                        <div className="flex justify-center">
                            <button onClick={generateQuestion} className="px-8 py-3 bg-neon-green text-black font-bold rounded-full hover:scale-105 shadow-[0_0_20px_rgba(10,255,10,0.5)] transition-transform flex items-center gap-2">
                                Next Node <Check size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubnetGame;
