import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Play, ToggleLeft, Hash, Network } from 'lucide-react';

interface TutorialModuleProps {
  addXP: (amount: number) => void;
  onExit: () => void;
}

type TaskType = 'toggle_bits' | 'input_match' | 'octet_select';

interface TutorialStep {
  title: string;
  content: string;
  taskType?: TaskType;
  taskConfig?: any;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: TutorialStep[];
  xpReward: number;
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'binary_basics',
    title: 'Binary Basics',
    description: 'Learn the language of machines (0s and 1s).',
    icon: <ToggleLeft size={24} />,
    xpReward: 100,
    steps: [
      {
        title: 'The Bit',
        content: 'A computer is just billions of switches. A switch is ON (1) or OFF (0). This is a "Bit".\n\nTurn the switch ON below.',
        taskType: 'toggle_bits',
        taskConfig: { bits: 1, targetValue: 1, labels: ['1'] }
      },
      {
        title: 'Place Value',
        content: 'In Decimal, we use 1s, 10s, 100s. In Binary, we use powers of 2: 1, 2, 4, 8.\n\nTurn on the switch for "4".',
        taskType: 'toggle_bits',
        taskConfig: { bits: 4, targetValue: 4, labels: ['8', '4', '2', '1'] }
      },
      {
        title: 'Adding Bits',
        content: 'To make the number 5, we add 4 + 1.\n\nToggle the correct switches to make 5.',
        taskType: 'toggle_bits',
        taskConfig: { bits: 4, targetValue: 5, labels: ['8', '4', '2', '1'] }
      }
    ]
  },
  {
    id: 'hex_intro',
    title: 'Hexadecimal',
    description: 'Base-16 notation used for colors and memory.',
    icon: <Hash size={24} />,
    xpReward: 100,
    steps: [
      {
        title: 'Base 16',
        content: 'Binary is too long. Hex uses 0-9 and A-F to count to 15 in a single digit.\n\nType "A" to represent 10.',
        taskType: 'input_match',
        taskConfig: { target: 'A', placeholder: 'A' }
      },
      {
        title: 'The Nibble',
        content: 'One Hex digit = 4 Binary bits (a Nibble). F is 1111 (15).\n\nWhat is Hex for 1010 (10)?',
        taskType: 'input_match',
        taskConfig: { target: 'A', placeholder: '?' }
      }
    ]
  },
  {
    id: 'subnet_start',
    title: 'Subnetting',
    description: 'Network vs Host portions of an IP.',
    icon: <Network size={24} />,
    xpReward: 100,
    steps: [
      {
        title: 'Octets',
        content: 'IPs have 4 parts called octets (e.g., 192.168.1.5).\n\nSelect the 3rd octet.',
        taskType: 'octet_select',
        taskConfig: { ip: '192.168.1.5', targetIndex: 2 }
      }
    ]
  }
];

const TutorialModule: React.FC<TutorialModuleProps> = ({ addXP, onExit }) => {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [bitState, setBitState] = useState<number[]>([0, 0, 0, 0]);
  const [inputState, setInputState] = useState('');
  const [selectedOctets, setSelectedOctets] = useState<number[]>([]);

  const startTutorial = (t: Tutorial) => {
    setActiveTutorial(t);
    setStepIndex(0);
    resetStepState();
  };

  const resetStepState = () => {
    setTaskCompleted(false);
    setBitState([0, 0, 0, 0]);
    setInputState('');
    setSelectedOctets([]);
  };

  const handleNext = () => {
    if (activeTutorial && stepIndex < activeTutorial.steps.length - 1) {
      setStepIndex(prev => prev + 1);
      resetStepState();
    } else {
      if (activeTutorial && !completedTutorials.includes(activeTutorial.id)) {
        addXP(activeTutorial.xpReward);
        setCompletedTutorials(prev => [...prev, activeTutorial.id]);
      }
      setActiveTutorial(null);
    }
  };

  const validateTask = (type: TaskType, config: any, state: any) => {
    if (type === 'toggle_bits') {
        const val = state.reduce((acc: number, bit: number, idx: number) => acc + (bit === 1 ? (parseInt(config.labels[idx]) || 1) : 0), 0);
        return val === config.targetValue;
    }
    if (type === 'input_match') return state.trim().toUpperCase() === config.target.toUpperCase();
    if (type === 'octet_select') return state.includes(config.targetIndex);
    return true;
  };

  const renderTask = (step: TutorialStep) => {
    if (!step.taskType) return null;
    const isSuccess = validateTask(step.taskType, step.taskConfig, step.taskType === 'toggle_bits' ? bitState : step.taskType === 'input_match' ? inputState : selectedOctets);
    if (isSuccess && !taskCompleted) setTaskCompleted(true);

    switch (step.taskType) {
        case 'toggle_bits':
            return (
                <div className="flex gap-4 justify-center my-8">
                    {step.taskConfig.labels.map((label: string, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => {
                                const newState = [...bitState];
                                newState[idx] = newState[idx] === 0 ? 1 : 0;
                                setBitState(newState);
                            }}
                            className={`w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${bitState[idx] === 1 ? 'bg-neon-blue text-black border-white shadow-[0_0_15px_#00f3ff]' : 'bg-gray-800 border-gray-600'}`}
                        >
                            <span className="text-2xl font-bold">{bitState[idx]}</span>
                            <span className="text-xs mt-2">{label}</span>
                        </button>
                    ))}
                </div>
            );
        case 'input_match':
            return (
                <div className="flex justify-center my-8">
                    <input type="text" value={inputState} onChange={(e) => setInputState(e.target.value)} placeholder={step.taskConfig.placeholder} maxLength={2} className="bg-gray-900 border-2 border-neon-purple rounded p-4 text-center text-3xl text-white w-32" />
                </div>
            );
        case 'octet_select':
            return (
                <div className="flex gap-2 justify-center my-8 font-mono text-2xl">
                    {step.taskConfig.ip.split('.').map((oct: string, idx: number) => (
                        <React.Fragment key={idx}>
                            <button onClick={() => setSelectedOctets([idx])} className={`p-2 rounded ${selectedOctets.includes(idx) ? 'bg-neon-green text-black' : 'text-white hover:bg-gray-800'}`}>{oct}</button>
                            {idx < 3 && <span className="text-gray-500">.</span>}
                        </React.Fragment>
                    ))}
                </div>
            );
        default: return null;
    }
  };

  if (activeTutorial) {
    const step = activeTutorial.steps[stepIndex];
    const progress = ((stepIndex + 1) / activeTutorial.steps.length) * 100;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col preserve-3d pt-12">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative preserve-3d transform hover:translate-z-4 transition-transform">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white">{activeTutorial.title}</h2>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Module {stepIndex + 1}/{activeTutorial.steps.length}</div>
                </div>
                
                <div className="w-full h-1 bg-gray-800 mb-8"><div className="h-full bg-neon-blue transition-all duration-500" style={{ width: `${progress}%` }}></div></div>

                <div className="mb-8 min-h-[200px]">
                    <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-lg text-gray-300 leading-relaxed">{step.content}</p>
                    {renderTask(step)}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <button onClick={() => setStepIndex(prev => Math.max(0, prev - 1))} disabled={stepIndex === 0} className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft /> Back</button>
                    <button onClick={handleNext} disabled={!taskCompleted && !!step.taskType} className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${(!taskCompleted && !!step.taskType) ? 'bg-gray-800 text-gray-500' : 'bg-neon-blue text-black hover:scale-105 shadow-lg'}`}>
                        {stepIndex === activeTutorial.steps.length - 1 ? 'Complete' : 'Next'} <ChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto preserve-3d h-full flex flex-col pt-12">
      <div className="mb-8 flex justify-between items-end preserve-3d">
        <div><h2 className="text-5xl font-bold text-white mb-2 tracking-tight" style={{textShadow: '0 0 20px white'}}>Training Grounds</h2></div>
        <button onClick={onExit} className="text-gray-400 hover:text-white flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-gray-700">Exit <ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 preserve-3d">
        {TUTORIALS.map((tut, idx) => (
          <div key={tut.id} onClick={() => startTutorial(tut)} className="bg-black/60 backdrop-blur-md border border-gray-700 p-8 rounded-2xl group transition-all hover:-translate-y-4 cursor-pointer shadow-xl hover:shadow-neon-blue/20 preserve-3d" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="bg-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-neon-blue group-hover:text-black transition-colors shadow-inner">{tut.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{tut.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{tut.description}</p>
            <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-neon-green bg-neon-green/10 px-2 py-1 rounded">+{tut.xpReward} XP</span>
                {completedTutorials.includes(tut.id) ? <CheckCircle className="text-green-500" size={20} /> : <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorialModule;