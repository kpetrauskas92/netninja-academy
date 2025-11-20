
import React, { useState, useEffect, useMemo } from 'react';
import { getExplanation } from '../services/geminiService';
import { RefreshCw, HelpCircle, Hash, Keyboard, ArrowRightLeft, XCircle, AlertTriangle, Lightbulb, CheckCircle, ArrowDown } from 'lucide-react';

interface HexGameProps {
  addXP: (amount: number) => void;
}

type GameMode = 'match' | 'translate';
type TranslationType = 'hex2bin' | 'bin2hex' | 'hex2dec' | 'dec2hex';

const HexGame: React.FC<HexGameProps> = ({ addXP }) => {
  const [mode, setMode] = useState<GameMode>('match');
  const [decimal, setDecimal] = useState(0);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showBinaryHint, setShowBinaryHint] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [translationType, setTranslationType] = useState<TranslationType>('hex2dec');
  const [inputValue, setInputValue] = useState('');
  const [formatError, setFormatError] = useState<string | null>(null);

  const correctHex = useMemo(() => decimal.toString(16).toUpperCase(), [decimal]);

  const generateLevel = () => {
    const target = Math.floor(Math.random() * 255);
    setDecimal(target);
    setResult(null);
    setHint('');
    setExplanation('');
    setShowBinaryHint(false);
    setFormatError(null);
    
    if (mode === 'match') {
        const correct = target.toString(16).toUpperCase();
        const wrong1 = (Math.max(0, target - Math.floor(Math.random() * 10) - 1)).toString(16).toUpperCase();
        const wrong2 = (target + Math.floor(Math.random() * 10) + 1).toString(16).toUpperCase();
        const wrong3 = Math.floor(Math.random() * 255).toString(16).toUpperCase();
        const allOptions = [correct, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
        const unique = Array.from(new Set(allOptions));
        while(unique.length < 4) unique.push(Math.floor(Math.random() * 255).toString(16).toUpperCase());
        setOptions(unique);
        setSelected(null);
    } else {
        const types: TranslationType[] = ['hex2bin', 'bin2hex', 'hex2dec', 'dec2hex'];
        setTranslationType(types[Math.floor(Math.random() * types.length)]);
        setInputValue('');
    }
  };

  useEffect(() => { generateLevel(); }, [mode]);

  const getMathBreakdown = (hex: string, dec: number) => {
      if (hex.length === 1) {
          return `Digit ${hex} equals ${dec}. Simple!`;
      }
      if (hex.length === 2) {
          const first = parseInt(hex[0], 16);
          const second = parseInt(hex[1], 16);
          return `(First digit '${hex[0]}' × 16) + (Second digit '${hex[1]}') = (${first} × 16) + ${second} = ${dec}.`;
      }
      return `Hex ${hex} is Base-16 for decimal ${dec}.`;
  }

  const handleSelect = (opt: string) => {
    if (result === 'correct') return;
    setSelected(opt);
    setShowBinaryHint(true); 
    if (opt === correctHex) {
      setResult('correct');
      addXP(75);
      setExplanation(getMathBreakdown(opt, decimal));
    } else {
      setResult('incorrect');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      setResult(null);

      if (!val) {
          setFormatError(null);
          return;
      }

      let errorMsg = null;
      if (translationType === 'hex2bin') {
          // Expecting Binary (0, 1, space)
          if (!/^[01\s]+$/.test(val)) errorMsg = "Binary only (0s and 1s)";
      } else if (translationType === 'hex2dec') {
          // Expecting Decimal
           if (!/^\d+$/.test(val)) errorMsg = "Decimal digits only (0-9)";
      } else {
          // Expecting Hex
           if (!/^[0-9A-Fa-f]+$/.test(val)) errorMsg = "Hex characters only (0-9, A-F)";
      }
      setFormatError(errorMsg);
  };

  const checkTranslation = () => {
    if (!inputValue || formatError) return;
    let isCorrect = false;
    const val = inputValue.trim().toUpperCase().replace(/\s/g, '');
    switch (translationType) {
        case 'hex2bin': isCorrect = parseInt(val, 2) === decimal; break;
        case 'bin2hex': isCorrect = val === correctHex; break;
        case 'hex2dec': isCorrect = parseInt(val) === decimal; break;
        case 'dec2hex': isCorrect = val === correctHex; break;
    }
    if (isCorrect) {
        setResult('correct');
        addXP(100);
        setShowBinaryHint(true);
        setExplanation(getMathBreakdown(correctHex, decimal));
    } else {
        setResult('incorrect');
    }
  };

  const getAIHint = async () => {
    let context = mode === 'match' ? `Convert decimal ${decimal} to hex.` : `Convert ${translationType} for value ${decimal}.`;
    const text = await getExplanation("Hexadecimal conversion", context);
    setHint(text);
  };

  const renderTranslateHeader = () => {
    let sourceLabel = '', sourceValue = '', targetLabel = '';
    switch (translationType) {
        case 'hex2bin': sourceLabel = 'Hex'; sourceValue = `0x${correctHex}`; targetLabel = 'Binary'; break;
        case 'bin2hex': sourceLabel = 'Binary'; sourceValue = decimal.toString(2).padStart(8, '0').replace(/(.{4})/g, '$1 ').trim(); targetLabel = 'Hex'; break;
        case 'hex2dec': sourceLabel = 'Hex'; sourceValue = `0x${correctHex}`; targetLabel = 'Decimal'; break;
        case 'dec2hex': sourceLabel = 'Decimal'; sourceValue = decimal.toString(); targetLabel = 'Hex'; break;
    }

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8 md:mb-12 preserve-3d">
            <div className="bg-gray-900/80 p-6 md:p-8 rounded-xl border border-gray-700 text-center min-w-[220px] shadow-xl transform hover:translate-z-10 transition-transform duration-500 preserve-3d w-full md:w-auto">
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">{sourceLabel}</div>
                <div className="text-3xl md:text-4xl font-bold text-white font-mono break-all">{sourceValue}</div>
            </div>
            
            <div className="text-gray-600 animate-pulse hidden md:block"><ArrowRightLeft size={32} /></div>
            <div className="text-gray-600 animate-pulse md:hidden"><ArrowDown size={32} /></div>

            <div className={`bg-black/60 p-6 md:p-8 rounded-xl border border-dashed min-w-[220px] transform hover:translate-z-10 transition-transform duration-500 preserve-3d relative w-full md:w-auto ${result === 'incorrect' ? 'border-red-500 animate-shake' : formatError ? 'border-yellow-500' : 'border-gray-700'}`}>
                <div className="text-gray-500 text-xs uppercase tracking-widest mb-2 text-center">{targetLabel}</div>
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && checkTranslation()}
                    placeholder="?"
                    className={`bg-transparent text-3xl md:text-4xl font-bold font-mono text-center w-full focus:outline-none placeholder-gray-700 ${result === 'incorrect' ? 'text-red-500' : formatError ? 'text-yellow-500' : 'text-white'}`}
                    autoFocus
                />
                {formatError && (
                    <div className="absolute -bottom-8 left-0 w-full text-center text-yellow-500 text-xs font-bold flex items-center justify-center gap-1">
                        <AlertTriangle size={12} /> {formatError}
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-4 h-full preserve-3d pt-4 md:pt-12">
      <div className="mb-6 text-center preserve-3d">
        <h2 className="text-3xl md:text-5xl font-mono font-bold text-neon-purple mb-4" style={{ textShadow: '0 0 30px rgba(188,19,254,0.6)' }}>Hex Hero</h2>
        <div className="flex justify-center gap-4 bg-black/30 p-2 rounded-full inline-flex border border-white/10 backdrop-blur-sm">
            <button onClick={() => setMode('match')} className={`px-6 py-2 rounded-full transition-all text-sm md:text-base ${mode === 'match' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Match</button>
            <button onClick={() => setMode('translate')} className={`px-6 py-2 rounded-full transition-all text-sm md:text-base ${mode === 'translate' ? 'bg-neon-blue text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Translate</button>
        </div>
      </div>

      <div className="bg-neon-card/80 backdrop-blur-xl p-6 md:p-10 rounded-3xl border border-neon-purple/20 shadow-2xl w-full relative preserve-3d transform transition-transform hover:scale-[1.01] duration-700">
          
          <div>
              {mode === 'match' ? (
                  <div className="flex justify-center mb-8 md:mb-12 preserve-3d">
                     <div className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-600 text-center min-w-[200px] md:min-w-[250px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform hover:rotate-x-12 transition-transform duration-500 cursor-default">
                        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Decimal Value</p>
                        <p className="text-5xl md:text-6xl font-bold text-white">{decimal}</p>
                     </div>
                  </div>
              ) : renderTranslateHeader()}

              {/* Game Area */}
              {mode === 'match' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 preserve-3d">
                    {options.map((opt, idx) => (
                      <button
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className={`
                          p-4 md:p-6 text-2xl md:text-3xl font-mono font-bold rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-2 hover:rotate-3 hover:shadow-xl preserve-3d
                          ${selected === opt 
                            ? (opt === correctHex 
                                ? 'bg-neon-green/20 border-neon-green text-neon-green shadow-neon-green/40' 
                                : 'bg-red-500/20 border-red-500 text-red-500 animate-shake') // Add shake to button
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-neon-purple hover:text-white'}
                        `}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        0x{opt}
                      </button>
                    ))}
                  </div>
              )}

              {/* Translation Controls */}
              {mode === 'translate' && (
                  <div className="flex justify-center">
                      <button 
                          onClick={checkTranslation} 
                          disabled={result === 'correct' || !!formatError} 
                          className={`px-8 md:px-10 py-3 rounded-full font-bold text-base md:text-lg transition-all shadow-lg 
                          ${result === 'correct' ? 'bg-neon-green text-black' : formatError ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:scale-105'}`}
                      >
                          {result === 'correct' ? 'DECODED' : 'VERIFY'}
                      </button>
                  </div>
              )}
          </div>

          {/* Feedback Overlay */}
          <div className="min-h-[120px] mt-8 text-center">
             {result === 'correct' && (
                <div className="animate-pop space-y-4">
                  
                   {explanation && (
                      <div className="max-w-md mx-auto bg-neon-green/10 border border-neon-green/30 p-4 rounded-xl flex items-start gap-3 text-left">
                           <Lightbulb className="text-neon-green shrink-0 mt-1" size={20} />
                           <div>
                              <div className="text-xs font-bold text-neon-green uppercase mb-1">Why is this correct?</div>
                              <div className="text-sm text-gray-200">{explanation}</div>
                           </div>
                      </div>
                   )}

                  <button onClick={generateLevel} className="bg-neon-purple text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(188,19,254,0.5)] hover:bg-fuchsia-500 mx-auto hover:scale-105 transition-transform">
                    NEXT NODE <RefreshCw size={20} />
                  </button>
                </div>
             )}

             {result === 'incorrect' && (
                 <div className="animate-shake inline-block bg-red-900/50 px-6 py-2 rounded-lg border border-red-500/50">
                    <div className="text-red-400 font-bold flex items-center gap-2"><XCircle size={20} /> MISMATCH DETECTED</div>
                 </div>
             )}
             
             {!result && !hint && (mode==='translate' || mode==='match') && (
                <button onClick={getAIHint} className="mt-4 text-gray-500 hover:text-neon-purple text-sm flex items-center justify-center gap-2 mx-auto transition-colors">
                    <HelpCircle size={14} /> Access Database Hint
                </button>
             )}
             
             {hint && <div className="mt-4 text-gray-400 bg-black/40 p-3 rounded border border-gray-700 inline-block max-w-xl">{hint}</div>}
          </div>
      </div>
    </div>
  );
};

export default HexGame;
