import React, { useState, useEffect } from 'react';
import { Cpu, Shield, Network, CheckCircle, ArrowRight, AlertTriangle, Trophy, Calendar } from 'lucide-react';

interface DailyChallengeProps {
  onComplete: () => void;
  onExit: () => void;
}

type StageType = 'binary' | 'hex' | 'subnet';

interface ChallengeStage {
  type: StageType;
  question: string;
  answer: string;
  hint: string;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ onComplete, onExit }) => {
  const [stages, setStages] = useState<ChallengeStage[]>([]);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Generate challenges on mount
  useEffect(() => {
    const newStages: ChallengeStage[] = [];

    // 1. Binary Challenge (Bin to Dec)
    const binVal = Math.floor(Math.random() * 255) + 1;
    newStages.push({
        type: 'binary',
        question: `Convert ${binVal.toString(2).padStart(8, '0')} to Decimal`,
        answer: binVal.toString(),
        hint: 'Sum the powers of 2 (128, 64, 32...)'
    });

    // 2. Hex Challenge (Hex to Dec)
    const hexVal = Math.floor(Math.random() * 255) + 1;
    newStages.push({
        type: 'hex',
        question: `Convert 0x${hexVal.toString(16).toUpperCase()} to Decimal`,
        answer: hexVal.toString(),
        hint: 'Multiply first digit by 16, add the second.'
    });

    // 3. Subnet Challenge (Usable Hosts)
    const cidrs = [24, 25, 26, 27, 28];
    const cidr = cidrs[Math.floor(Math.random() * cidrs.length)];
    const usable = Math.pow(2, 32 - cidr) - 2;
    newStages.push({
        type: 'subnet',
        question: `Usable hosts in a /${cidr} subnet?`,
        answer: usable.toString(),
        hint: `2^(32-${cidr}) - 2`
    });

    setStages(newStages);
  }, []);

  const handleSubmit = () => {
    if (!stages.length) return;
    
    if (input.trim() === stages[currentStageIdx].answer) {
        setSuccess(true);
        setTimeout(() => {
            if (currentStageIdx < stages.length - 1) {
                setCurrentStageIdx(prev => prev + 1);
                setInput('');
                setSuccess(false);
                setError(false);
            } else {
                onComplete();
            }
        }, 1000);
    } else {
        setError(true);
        setTimeout(() => setError(false), 500);
    }
  };

  if (stages.length === 0) return <div className="text-center pt-20 text-neon-blue animate-pulse">Generating Daily Gauntlet...</div>;

  const currentStage = stages[currentStageIdx];

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto p-4 pt-20 h-full preserve-3d">
        {/* Header */}
        <div className="text-center mb-8 preserve-3d">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-1 rounded-full border border-yellow-500/30 mb-4">
                <Calendar size={16} /> <span>Daily Protocol</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-2 tracking-tighter" style={{ textShadow: '0 0 20px rgba(234,179,8,0.5)' }}>
                The Gauntlet
            </h2>
            <p className="text-gray-400">Complete all 3 tasks to extend your streak.</p>
        </div>

        {/* Progress Pipeline */}
        <div className="flex items-center justify-center gap-4 mb-12 w-full preserve-3d">
            {stages.map((_, idx) => (
                <div key={idx} className="flex items-center">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-500
                        ${idx < currentStageIdx ? 'bg-neon-green border-neon-green text-black' : 
                          idx === currentStageIdx ? 'bg-yellow-500 text-black border-yellow-500 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 
                          'bg-gray-800 border-gray-600 text-gray-500'}
                    `}>
                        {idx < currentStageIdx ? <CheckCircle size={20} /> : idx + 1}
                    </div>
                    {idx < stages.length - 1 && (
                        <div className={`w-12 h-1 mx-2 rounded-full transition-colors duration-500 ${idx < currentStageIdx ? 'bg-neon-green' : 'bg-gray-800'}`}></div>
                    )}
                </div>
            ))}
        </div>

        {/* Challenge Card */}
        <div className="w-full bg-black/80 backdrop-blur-xl p-10 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)] preserve-3d relative transform transition-transform duration-500 hover:translate-z-4">
            
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-800 rounded-xl">
                        {currentStage.type === 'binary' && <Cpu className="text-neon-blue" size={32} />}
                        {currentStage.type === 'hex' && <Shield className="text-neon-purple" size={32} />}
                        {currentStage.type === 'subnet' && <Network className="text-neon-green" size={32} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest">{currentStage.type} Phase</h3>
                        <p className="text-gray-500 text-sm">Task {currentStageIdx + 1} of 3</p>
                    </div>
                </div>
                <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded text-xs font-bold border border-yellow-500/30">
                    +300 XP Reward
                </div>
            </div>

            <div className="text-center mb-8">
                <div className="text-3xl font-mono font-bold text-white mb-8 p-6 bg-gray-900/50 rounded-xl border border-white/5">
                    {currentStage.question}
                </div>

                <div className="relative max-w-xs mx-auto">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setError(false);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Enter value..."
                        className={`
                            w-full bg-black border-b-2 text-center text-2xl font-mono py-3 focus:outline-none transition-all
                            ${error ? 'border-red-500 text-red-500 animate-shake' : 
                              success ? 'border-neon-green text-neon-green' : 'border-gray-600 text-white focus:border-yellow-500'}
                        `}
                        autoFocus
                    />
                    {error && <div className="absolute -bottom-6 left-0 w-full text-red-500 text-xs flex justify-center items-center gap-1"><AlertTriangle size={12}/> Incorrect</div>}
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <button onClick={onExit} className="px-6 py-3 rounded-full text-gray-500 hover:text-white transition-colors">
                    Abort
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={success}
                    className={`px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all shadow-lg hover:scale-105
                        ${success ? 'bg-neon-green text-black' : 'bg-yellow-500 text-black hover:bg-yellow-400'}
                    `}
                >
                    {success ? 'VERIFIED' : 'SUBMIT'} <ArrowRight size={20} />
                </button>
            </div>

            {/* Hint Section */}
            {!success && !error && (
                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-xs">HINT: {currentStage.hint}</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default DailyChallenge;