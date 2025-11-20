
import React, { useState, useEffect } from 'react';
import { getExplanation } from '../services/geminiService';
import { RefreshCw, HelpCircle, CheckCircle, XCircle, ArrowRightLeft, Eye, EyeOff, Calculator, Layers, Lightbulb } from 'lucide-react';

interface BinaryGameProps {
  addXP: (amount: number) => void;
}

type Mode = 'builder' | 'decoder' | 'bitwise';
type Operator = 'AND' | 'OR' | 'XOR';

const BinaryGame: React.FC<BinaryGameProps> = ({ addXP }) => {
  const [mode, setMode] = useState<Mode>('builder');
  const [hardMode, setHardMode] = useState(false);
  
  const [target, setTarget] = useState(0);
  
  // Builder/Bitwise Shared State (The interactive bits)
  const [bits, setBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]); 
  
  // Decoder Mode State
  const [decoderInput, setDecoderInput] = useState('');
  const [formatError, setFormatError] = useState<string | null>(null);
  
  // Bitwise Mode State
  const [operandA, setOperandA] = useState(0);
  const [operandB, setOperandB] = useState(0);
  const [operator, setOperator] = useState<Operator>('AND');

  const [message, setMessage] = useState('');
  const [explanation, setExplanation] = useState(''); // New state for detailed feedback
  const [hint, setHint] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const generateTarget = () => {
    setBits([0, 0, 0, 0, 0, 0, 0, 0]);
    setDecoderInput('');
    setFormatError(null);
    setMessage('');
    setExplanation('');
    setHint('');
    setIsCorrect(null);

    if (mode === 'bitwise') {
        const op = ['AND', 'OR', 'XOR'][Math.floor(Math.random() * 3)] as Operator;
        const a = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        setOperandA(a);
        setOperandB(b);
        setOperator(op);
        let result = 0;
        if (op === 'AND') result = a & b;
        if (op === 'OR') result = a | b;
        if (op === 'XOR') result = a ^ b;
        setTarget(result);
    } else {
        const newTarget = Math.floor(Math.random() * 255) + 1;
        setTarget(newTarget);
    }
  };

  useEffect(() => {
    generateTarget();
  }, [mode]);

  const toggleBit = (index: number) => {
    if (isCorrect === true || mode === 'decoder') return; 
    setIsCorrect(null); // Reset error state to allow retry animation
    const newBits = [...bits];
    newBits[index] = newBits[index] === 0 ? 1 : 0;
    setBits(newBits);
  };

  const handleDecoderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDecoderInput(val);
      setIsCorrect(null);

      if (val === '') {
        setFormatError(null);
        return;
      }
      
      // Validation
      if (!/^\d+$/.test(val)) {
        setFormatError('Numbers only');
        return;
      }
      
      const num = parseInt(val, 10);
      if (num > 255) {
        setFormatError('Max value is 255 (8-bit)');
      } else {
        setFormatError(null);
      }
  };

  const currentBuilderValue = bits.reduce((acc, bit, index) => acc + (bit * Math.pow(2, 7 - index)), 0);
  const targetBits = target.toString(2).padStart(8, '0').split('').map(Number);
  const getBits = (num: number) => num.toString(2).padStart(8, '0').split('').map(Number);

  const generateExplanation = () => {
      if (mode === 'builder' || mode === 'decoder') {
          // Identify which bits are ON
          const activeValues = targetBits.map((bit, i) => bit === 1 ? Math.pow(2, 7 - i) : 0).filter(v => v > 0);
          if (activeValues.length === 0) return "Since all bits are 0, the total is 0.";
          
          return `You get ${target} by adding the ON bits: ${activeValues.join(' + ')} = ${target}.`;
      } 
      if (mode === 'bitwise') {
          if (operator === 'AND') return "AND Rule: Result is 1 only if BOTH top and bottom bits are 1.";
          if (operator === 'OR') return "OR Rule: Result is 1 if EITHER the top OR bottom bit is 1.";
          if (operator === 'XOR') return "XOR Rule: Result is 1 only if the bits are DIFFERENT (one is 1, one is 0).";
      }
      return "";
  };

  const checkAnswer = () => {
    if (formatError) return; // Prevent submission if format is invalid

    let correct = false;
    if (mode === 'builder' || mode === 'bitwise') {
        if (currentBuilderValue === target) correct = true;
    } else {
        if (parseInt(decoderInput) === target) correct = true;
    }

    if (correct) {
      setIsCorrect(true);
      setMessage('CORRECT! System Online.');
      setExplanation(generateExplanation());
      
      let xpAmount = 50;
      if (mode === 'decoder') xpAmount = 75;
      if (mode === 'bitwise') xpAmount = 125;
      if (hardMode) xpAmount += 25;
      addXP(xpAmount);
    } else {
      setIsCorrect(false);
      setMessage('ERROR: Value Mismatch.');
      setExplanation('');
    }
  };

  const getAIHint = async () => {
    setLoadingHint(true);
    let context = "";
    if (mode === 'builder') context = `Trying to make ${target}, has ${currentBuilderValue}.`;
    else if (mode === 'decoder') context = `Convert binary ${targetBits.join('')} to Decimal.`;
    else context = `Bitwise ${operator} between ${operandA} and ${operandB}.`;
    const explanation = await getExplanation("Binary Logic", context);
    setHint(explanation);
    setLoadingHint(false);
  };

  const renderEquation = () => {
    if (mode === 'bitwise') return null;
    if (mode === 'decoder' && !isCorrect) return <div className="text-gray-500 italic text-sm animate-pulse">Solve the equation...</div>;
    const activeBitsToRender = mode === 'builder' ? bits : targetBits;
    const activeParts = activeBitsToRender.map((bit, index) => bit === 1 ? Math.pow(2, 7 - index) : null).filter(n => n !== null);
    if (activeParts.length === 0) return <span className="text-gray-600">0</span>;
    return (
        <div className="flex flex-wrap justify-center gap-2 font-mono text-xs md:text-sm text-neon-blue">
            {activeParts.map((val, i) => (
                <React.Fragment key={i}>
                    <span>{val}</span>
                    {i < activeParts.length - 1 && <span className="text-white">+</span>}
                </React.Fragment>
            ))}
            <span className="text-white">= {mode === 'builder' ? currentBuilderValue : target}</span>
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-4 preserve-3d min-h-full pt-4 md:pt-12">
      {/* Header Area */}
      <div className="mb-6 text-center w-full relative preserve-3d">
        <h2 className="text-3xl md:text-5xl font-mono font-bold text-neon-blue mb-2 glitch-hover inline-block" style={{ textShadow: '0 0 20px rgba(0, 243, 255, 0.5)' }}>
            Binary Blitzer
        </h2>
        
        {/* Mode Switcher */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 mt-4">
            <button onClick={() => setMode('builder')} className={`px-3 py-1 text-xs md:text-base rounded border ${mode === 'builder' ? 'bg-neon-blue text-black border-neon-blue' : 'bg-black/50 text-gray-400 border-gray-700'}`}>Builder</button>
            <button onClick={() => setMode('decoder')} className={`px-3 py-1 text-xs md:text-base rounded border ${mode === 'decoder' ? 'bg-neon-purple text-white border-neon-purple' : 'bg-black/50 text-gray-400 border-gray-700'}`}>Decoder</button>
            <button onClick={() => setMode('bitwise')} className={`px-3 py-1 text-xs md:text-base rounded border ${mode === 'bitwise' ? 'bg-neon-green text-black border-neon-green' : 'bg-black/50 text-gray-400 border-gray-700'}`}>Bitwise</button>
        </div>
      </div>

      {/* Game Board (The Deck) */}
      <div className="bg-black/60 backdrop-blur-xl p-4 md:p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-3xl relative preserve-3d transform transition-transform duration-500">
        
        {/* Hard Mode Toggle - Elevated in 3D Space for clickability */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 transform translate-z-20">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setHardMode(!hardMode);
                }}
                className={`flex items-center gap-2 text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded border cursor-pointer transition-all hover:scale-105 ${hardMode ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-black/60 border-gray-600 text-gray-400 hover:text-white hover:border-white'}`}
            >
                {hardMode ? <EyeOff size={14} /> : <Eye size={14} />} {hardMode ? 'HARD' : 'NORMAL'}
            </button>
        </div>

        {/* Target Display */}
        <div className="flex justify-between items-center mb-8 md:mb-12 pt-8 md:pt-4 preserve-3d flex-col md:flex-row gap-6 md:gap-0">
            {mode === 'bitwise' ? (
                 <div className="w-full text-center font-mono text-gray-300">
                    <div className="flex flex-col gap-2 items-center bg-black/40 p-4 rounded-xl border border-white/5">
                         <div className="flex items-center gap-4"><span className="w-8 text-xs text-gray-500">A</span> <span className="font-bold tracking-widest text-lg">{operandA.toString(2).padStart(8,'0')}</span></div>
                         <div className="flex items-center gap-4"><span className="w-8 text-neon-green font-bold">{operator}</span> <span className="font-bold tracking-widest text-lg">{operandB.toString(2).padStart(8,'0')}</span></div>
                         <div className="w-full h-px bg-gray-600"></div>
                    </div>
                 </div>
            ) : (
                <>
                <div className="text-center flex-1">
                    <span className="block text-gray-500 text-xs uppercase tracking-widest mb-2">{mode === 'builder' ? 'Target Decimal' : 'Target Binary'}</span>
                    <div className="bg-black/50 border border-neon-blue/30 rounded-lg py-3 md:py-4 px-6 md:px-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                        <span className="text-4xl md:text-5xl font-bold text-white font-mono text-shadow-neon">
                            {mode === 'builder' ? target : <span className="text-neon-blue text-xl md:text-3xl tracking-[0.15em]">{targetBits.join('')}</span>}
                        </span>
                    </div>
                </div>
                
                <div className="px-4 text-gray-600 rotate-90 md:rotate-0"><ArrowRightLeft size={24} /></div>

                <div className="text-center flex-1 relative">
                    <span className="block text-gray-500 text-xs uppercase tracking-widest mb-2">{mode === 'builder' ? 'Current Sum' : 'Enter Decimal'}</span>
                    {mode === 'builder' ? (
                        <div className={`bg-black/50 border rounded-lg py-3 md:py-4 px-6 md:px-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-colors duration-300 ${currentBuilderValue === target ? 'border-neon-green text-neon-green' : 'border-gray-700 text-neon-purple'}`}>
                            <span className="text-4xl md:text-5xl font-bold font-mono">{currentBuilderValue}</span>
                        </div>
                    ) : (
                        <div className="relative">
                            <input 
                                type="text" 
                                inputMode="numeric"
                                value={decoderInput}
                                onChange={handleDecoderChange}
                                className={`w-full bg-black/50 border-b-2 text-center text-4xl md:text-5xl font-bold focus:outline-none py-2 transition-all ${isCorrect === false ? 'border-red-500 text-red-500 animate-shake' : formatError ? 'border-yellow-500 text-yellow-500' : 'border-neon-purple text-white focus:border-neon-green'}`}
                                placeholder="?"
                            />
                            {formatError && (
                                <div className="absolute top-full left-0 w-full text-center text-yellow-500 text-xs font-mono mt-2 bg-yellow-900/20 py-1 rounded">
                                    ⚠️ {formatError}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </>
            )}
        </div>

        {/* 3D Bits Interaction Area */}
        {mode !== 'decoder' && (
             <div className={`flex justify-center items-center gap-1 md:gap-3 mb-10 preserve-3d flex-wrap md:flex-nowrap ${isCorrect === false ? 'animate-shake' : ''}`}>
                {(mode === 'builder' ? bits : bits).map((bit, index) => {
                    const value = Math.pow(2, 7 - index);
                    // 3D Cube Render
                    return (
                        <div key={index} className="relative w-8 h-12 md:w-14 md:h-20 cursor-pointer group cube-wrap" onClick={() => toggleBit(index)}>
                            <div className={`cube ${bit === 1 ? 'show-back' : 'show-front'}`}>
                                {/* Front Face (OFF) */}
                                <div className="cube-face cube-face-front bg-gray-800 border border-gray-600 rounded shadow-[inset_0_0_10px_rgba(0,0,0,1)] flex flex-col items-center justify-center group-hover:border-gray-400 transition-colors">
                                    <span className="text-gray-500 font-mono text-lg md:text-xl font-bold">0</span>
                                    {!hardMode && <span className="text-[8px] md:text-[9px] text-gray-600 mt-1">{value}</span>}
                                </div>
                                {/* Back Face (ON) */}
                                <div className="cube-face cube-face-back bg-neon-blue border-2 border-white/50 rounded shadow-[0_0_15px_#00f3ff] flex flex-col items-center justify-center">
                                    <span className="text-black font-mono text-lg md:text-xl font-bold">1</span>
                                    {!hardMode && <span className="text-[8px] md:text-[9px] text-black/70 mt-1 font-bold">{value}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
        
        {/* Decoder Static Bits */}
        {mode === 'decoder' && (
            <div className="flex justify-center gap-1 md:gap-2 mb-10 preserve-3d">
                {targetBits.map((bit, index) => (
                    <div key={index} className={`
                        w-8 h-12 md:w-10 md:h-14 flex flex-col items-center justify-center rounded border-2 font-bold text-lg md:text-xl shadow-lg
                        ${bit === 1 ? 'bg-neon-purple border-white text-white shadow-neon-purple/50' : 'bg-gray-900 border-gray-700 text-gray-600'}
                    `}>
                        {bit}
                    </div>
                ))}
            </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col gap-6 relative z-10">
           {mode !== 'bitwise' && <div className="text-center h-6">{renderEquation()}</div>}
           
           <div className="flex justify-center gap-4">
            <button
                onClick={checkAnswer}
                disabled={isCorrect === true || !!formatError}
                className={`px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg uppercase tracking-widest transition-all shadow-lg transform active:scale-95
                  ${isCorrect === true ? 'bg-neon-green text-black shadow-neon-green/50' : formatError ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 hover:scale-105'}
                `}
              >
                {isCorrect === true ? 'ACCESS GRANTED' : 'EXECUTE'}
              </button>
              
              {isCorrect && (
                <button onClick={generateTarget} className="p-3 md:p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 border border-gray-600 animate-pop">
                  <RefreshCw size={20} className="animate-spin-slow" />
                </button>
              )}
           </div>

            {/* Status Output */}
            <div className="min-h-[100px] text-center">
              {message && (
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border font-bold text-sm md:text-lg animate-pop backdrop-blur-sm ${isCorrect ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
                  {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />} {message}
                </div>
              )}

              {/* Correct Answer Explanation */}
              {isCorrect && explanation && (
                  <div className="mt-4 max-w-lg mx-auto animate-fade-in-up">
                      <div className="bg-neon-green/10 border border-neon-green/30 p-3 md:p-4 rounded-xl flex items-start gap-3 text-left">
                          <Lightbulb className="text-neon-green shrink-0 mt-1" size={20} />
                          <div>
                              <h4 className="font-bold text-neon-green text-sm uppercase mb-1">Why is this correct?</h4>
                              <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{explanation}</p>
                          </div>
                      </div>
                  </div>
              )}
              
              {!isCorrect && !hint && (
                 <button onClick={getAIHint} disabled={loadingHint} className="block mt-4 text-sm text-neon-blue hover:text-white mx-auto transition-colors">
                   {loadingHint ? "Decrypting..." : "Request Neural Hint"}
               </button>
              )}
              {hint && <div className="mt-4 text-sm text-gray-300 bg-black/50 p-2 rounded border border-white/10 inline-block max-w-lg">{hint}</div>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BinaryGame;
