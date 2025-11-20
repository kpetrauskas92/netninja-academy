
import React, { useState, useEffect } from 'react';
import { GameMode, PlayerStats, ShopItem } from './types';
import BinaryGame from './components/BinaryGame';
import HexGame from './components/HexGame';
import SubnetGame from './components/SubnetGame';
import PacketTracerGame from './components/PacketTracerGame';
import FirewallGame from './components/FirewallGame';
import ThreatHunterGame from './components/ThreatHunterGame';
import TutorialModule from './components/TutorialModule';
import DailyChallenge from './components/DailyChallenge';
import Shop, { SHOP_ITEMS } from './components/Shop';
import SandboxMode from './components/SandboxMode';
import AITutor from './components/AITutor';
import StudyModal from './components/StudyModal';
import { Terminal, Shield, Cpu, BookOpen, MessageSquare, User, Award, Lock, X, Check, HelpCircle, GraduationCap, PlayCircle, Globe, Calendar, Flame, ShoppingBag, Sliders, Lock as LockIcon, Zap, Search } from 'lucide-react';

// Badge Configuration
const BADGES_CONFIG = [
    { id: 'hello_world', name: 'Hello World', desc: 'Earn your first 50 XP', icon: '🌱', reqXp: 50 },
    { id: 'script_kiddie', name: 'Script Kiddie', desc: 'Reach Level 2', icon: '⚡', reqLevel: 2 },
    { id: 'packet_stream', name: 'Packet Stream', desc: 'Reach a streak of 5', icon: '🌊', reqStreak: 5 },
    { id: 'binary_baron', name: 'Binary Baron', desc: 'Reach Level 3', icon: '🤖', reqLevel: 3 },
    { id: 'net_ninja', name: 'Net Ninja', desc: 'Reach Level 5', icon: '🥷', reqLevel: 5 },
    { id: 'cyber_master', name: 'Cyber Master', desc: 'Reach Level 10', icon: '👑', reqLevel: 10 },
];

const DEFAULT_STATS: PlayerStats = {
    xp: 0,
    level: 1,
    streak: 0,
    badges: [],
    inventory: ['theme_default', 'av_robot'],
    equipped: {
        theme: 'theme_default',
        avatar: 'av_robot',
        frame: 'frame_default'
    }
};

const App = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>(GameMode.DASHBOARD);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  
  // Initialize stats from LocalStorage if available
  const [stats, setStats] = useState<PlayerStats>(() => {
      const saved = localStorage.getItem('netninja_player_stats');
      if (saved) {
          try {
              return { ...DEFAULT_STATS, ...JSON.parse(saved) };
          } catch (e) {
              console.error("Failed to parse save file", e);
              return DEFAULT_STATS;
          }
      }
      return DEFAULT_STATS;
  });

  // Persist stats to LocalStorage whenever they change
  useEffect(() => {
      localStorage.setItem('netninja_player_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const lastDate = localStorage.getItem('netninja_last_daily');
    if (lastDate === new Date().toDateString()) {
        setDailyCompleted(true);
    }
  }, []);

  // Theme Manager
  useEffect(() => {
    const themeItem = SHOP_ITEMS.find(i => i.id === stats.equipped.theme);
    if (themeItem && themeItem.config) {
        const root = document.documentElement;
        Object.entries(themeItem.config).forEach(([key, value]) => {
            root.style.setProperty(key, value as string);
        });
    }
  }, [stats.equipped.theme]);

  // Calculate level based on XP
  useEffect(() => {
    const newLevel = Math.floor(stats.xp / 500) + 1;
    if (newLevel > stats.level) {
        setStats(s => ({ ...s, level: newLevel }));
    }
  }, [stats.xp, stats.level]);

  // Check for unlocked badges
  useEffect(() => {
      const currentBadges = new Set(stats.badges);
      let newBadgesAdded = false;
      const updatedBadges = [...stats.badges];

      BADGES_CONFIG.forEach(badge => {
          if (!currentBadges.has(badge.id)) {
              let earned = false;
              if (badge.reqXp && stats.xp >= badge.reqXp) earned = true;
              if (badge.reqLevel && stats.level >= badge.reqLevel) earned = true;
              if (badge.reqStreak && stats.streak >= badge.reqStreak) earned = true;

              if (earned) {
                  updatedBadges.push(badge.id);
                  newBadgesAdded = true;
              }
          }
      });

      if (newBadgesAdded) {
          setStats(prev => ({ ...prev, badges: updatedBadges }));
      }
  }, [stats.xp, stats.level, stats.streak, stats.badges]);

  const addXP = (amount: number) => {
    setStats(prev => ({
        ...prev,
        xp: prev.xp + amount,
    }));
  };

  const handleDailyComplete = () => {
      setStats(prev => ({
          ...prev,
          xp: prev.xp + 300,
          streak: prev.streak + 1
      }));
      setDailyCompleted(true);
      localStorage.setItem('netninja_last_daily', new Date().toDateString());
      setCurrentMode(GameMode.DASHBOARD);
  };

  const handlePurchase = (item: ShopItem) => {
      if (stats.xp >= item.price) {
          setStats(prev => ({
              ...prev,
              xp: prev.xp - item.price,
              inventory: [...prev.inventory, item.id]
          }));
      }
  };

  const handleEquip = (item: ShopItem) => {
      setStats(prev => ({
          ...prev,
          equipped: {
              ...prev.equipped,
              [item.type]: item.id
          }
      }));
  };

  const renderContent = () => {
    return (
      <div key={currentMode} className="animate-fade-in-up h-full">
        {(() => {
          switch (currentMode) {
            case GameMode.TUTORIAL:
              return <TutorialModule addXP={addXP} onExit={() => setCurrentMode(GameMode.DASHBOARD)} />;
            case GameMode.BINARY:
              return <BinaryGame addXP={addXP} />;
            case GameMode.HEX:
              return <HexGame addXP={addXP} />;
            case GameMode.SUBNET:
              return <SubnetGame addXP={addXP} />;
            case GameMode.PACKET_TRACER:
              return <PacketTracerGame addXP={addXP} inventory={stats.inventory} />;
            case GameMode.FIREWALL:
              return <FirewallGame addXP={addXP} />;
            case GameMode.THREAT_HUNTER:
              return <ThreatHunterGame addXP={addXP} />;
            case GameMode.DAILY_CHALLENGE:
              return <DailyChallenge onComplete={handleDailyComplete} onExit={() => setCurrentMode(GameMode.DASHBOARD)} />;
            case GameMode.SHOP:
              return <Shop stats={stats} onPurchase={handlePurchase} onEquip={handleEquip} onExit={() => setCurrentMode(GameMode.DASHBOARD)} />;
            case GameMode.SANDBOX:
              return <SandboxMode onExit={() => setCurrentMode(GameMode.DASHBOARD)} />;
            default:
              return <Dashboard changeMode={setCurrentMode} stats={stats} dailyCompleted={dailyCompleted} />;
          }
        })()}
      </div>
    );
  };

  const currentAvatarIcon = SHOP_ITEMS.find(i => i.id === stats.equipped.avatar)?.icon || '🤖';

  return (
    <div className="perspective-scene bg-neon-dark overflow-hidden">
      {/* The World Container */}
      <div className="world-3d flex flex-col md:flex-row h-full">
          {/* Infinite Grid Background */}
          <div className="retro-grid-plane"></div>
          <div className="horizon-glow"></div>

          {/* Sidebar Navigation */}
          <nav className="w-full md:w-64 p-6 flex flex-col justify-between relative z-40 bg-[#0b0b14] border-r border-white/10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
            <div>
              <div 
                className="flex items-center gap-3 mb-10 cursor-pointer group" 
                onClick={() => setCurrentMode(GameMode.DASHBOARD)}
              >
                <div className="bg-neon-blue p-2 rounded shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,243,255,0.8)] transition-all duration-300 group-hover:rotate-[360deg]">
                  <Terminal className="text-black" size={24} />
                </div>
                <h1 className="font-bold text-xl tracking-tighter text-white glitch-hover">NET<span className="text-neon-blue">NINJA</span></h1>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin">
                <NavButton 
                    active={currentMode === GameMode.DASHBOARD} 
                    onClick={() => setCurrentMode(GameMode.DASHBOARD)} 
                    icon={<BookOpen size={18} />} 
                    label="Dashboard" 
                />
                 <NavButton 
                    active={currentMode === GameMode.SHOP} 
                    onClick={() => setCurrentMode(GameMode.SHOP)} 
                    icon={<ShoppingBag size={18} />} 
                    label="Cyber Deck Store" 
                />
                
                <div className="pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Training Protocols</div>
                
                <NavButton 
                    active={currentMode === GameMode.TUTORIAL} 
                    onClick={() => setCurrentMode(GameMode.TUTORIAL)} 
                    icon={<GraduationCap size={18} />} 
                    label="Tutorials" 
                />
                <NavButton 
                    active={false} 
                    onClick={() => setIsStudyOpen(true)} 
                    icon={<HelpCircle size={18} className="text-neon-green" />} 
                    label="Field Manual" 
                />

                <div className="pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Simulations</div>
                <NavButton 
                    active={currentMode === GameMode.BINARY} 
                    onClick={() => setCurrentMode(GameMode.BINARY)} 
                    icon={<Cpu size={18} />} 
                    label="Binary Blitzer" 
                />
                <NavButton 
                    active={currentMode === GameMode.HEX} 
                    onClick={() => setCurrentMode(GameMode.HEX)} 
                    icon={<Shield size={18} />} 
                    label="Hex Hero" 
                />
                <NavButton 
                    active={currentMode === GameMode.SUBNET} 
                    onClick={() => setCurrentMode(GameMode.SUBNET)} 
                    icon={<NetworkIcon />} 
                    label="Subnet Showdown" 
                />
                 <NavButton 
                    active={currentMode === GameMode.PACKET_TRACER} 
                    onClick={() => setCurrentMode(GameMode.PACKET_TRACER)} 
                    icon={<Globe size={18} />} 
                    label="Packet Tracer" 
                />

                 <div className="pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Defense Systems</div>
                 <NavButton 
                    active={currentMode === GameMode.FIREWALL} 
                    onClick={() => setCurrentMode(GameMode.FIREWALL)} 
                    icon={<Zap size={18} className="text-red-500" />} 
                    label="Firewall Frenzy" 
                />
                <NavButton 
                    active={currentMode === GameMode.THREAT_HUNTER} 
                    onClick={() => setCurrentMode(GameMode.THREAT_HUNTER)} 
                    icon={<Search size={18} className="text-neon-blue" />} 
                    label="Threat Hunter" 
                />

                 <div className="pt-2"></div>
                 <NavButton 
                    active={currentMode === GameMode.SANDBOX} 
                    onClick={() => setCurrentMode(GameMode.SANDBOX)} 
                    icon={<Sliders size={18} className="text-neon-pink" />} 
                    label="Sandbox Mode" 
                />
              </div>
            </div>

            {/* Player Stats Mini */}
            <div className="mt-4 pt-6 border-t border-white/10 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-neon-purple/50 shadow-[0_0_10px_rgba(188,19,254,0.3)] text-2xl">
                        {currentAvatarIcon}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Cadet Level {stats.level}</div>
                        <div className="text-xs text-gray-300">{stats.xp} XP</div>
                    </div>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-neon-purple h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(188,19,254,0.7)]" 
                        style={{ width: `${(stats.xp % 500) / 5}%` }}
                    ></div>
                </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 relative overflow-y-auto h-full perspective-scene">
             {/* Top Bar Mobile Only */}
             <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-30">
                <span className="font-bold text-neon-blue">NETNINJA</span>
                <div className="flex items-center gap-4">
                   <button onClick={() => setIsStudyOpen(true)} className="text-neon-green">
                      <BookOpen size={20} />
                   </button>
                   <div className="text-xs text-white">Lvl {stats.level}</div>
                </div>
             </div>

            <div className="p-6 md:p-12 max-w-7xl mx-auto pb-24 min-h-full preserve-3d">
                {renderContent()}
            </div>
          </main>
      </div>

      {/* Floating Overlay Elements */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-8 right-8 bg-neon-blue hover:bg-white text-black p-4 rounded-full shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all hover:scale-110 hover:rotate-12 z-50 flex items-center justify-center group active:scale-90"
      >
        <MessageSquare size={24} fill="currentColor" className="group-hover:animate-bounce" />
      </button>

      <AITutor isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <StudyModal isOpen={isStudyOpen} onClose={() => setIsStudyOpen(false)} />
    </div>
  );
};

// Helper Components
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden shrink-0 ${
            active 
            ? 'bg-neon-blue/10 text-white border-l-2 border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.2)] translate-x-2' 
            : 'text-gray-300 hover:text-white hover:bg-white/5 hover:translate-x-1'
        }`}
    >
        <span className={`relative z-10 transition-transform group-hover:scale-110 ${active ? 'text-neon-blue' : ''}`}>{icon}</span>
        <span className="font-medium relative z-10">{label}</span>
    </button>
);

const Dashboard = ({ changeMode, stats, dailyCompleted }: { changeMode: (m: GameMode) => void, stats: PlayerStats, dailyCompleted: boolean }) => {
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGES_CONFIG[0] | null>(null);

  const calculateProgress = (badge: typeof BADGES_CONFIG[0]) => {
      if (stats.badges.includes(badge.id)) return 100;
      let progress = 0;
      if (badge.reqXp) progress = (stats.xp / badge.reqXp) * 100;
      else if (badge.reqLevel) progress = (stats.level / badge.reqLevel) * 100;
      else if (badge.reqStreak) progress = (stats.streak / badge.reqStreak) * 100;
      return Math.min(100, Math.max(0, progress));
  };

  const getProgressLabel = (badge: typeof BADGES_CONFIG[0]) => {
      if (badge.reqXp) return `${stats.xp}/${badge.reqXp} XP`;
      if (badge.reqLevel) return `Lvl ${stats.level}/${badge.reqLevel}`;
      if (badge.reqStreak) return `${stats.streak}/${badge.reqStreak}`;
      return '';
  };

  return (
    <div className="space-y-12 preserve-3d">
        {/* Badge Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedBadge(null)}>
              <div className="bg-neon-card border border-neon-blue/30 rounded-2xl p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(0,243,255,0.2)] animate-pop transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                  <div className="flex flex-col items-center text-center">
                      <div className={`text-6xl mb-6 p-6 rounded-full bg-black/40 border border-white/10 shadow-inner ${stats.badges.includes(selectedBadge.id) ? 'grayscale-0 animate-float' : 'grayscale opacity-50'}`}>{selectedBadge.icon}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedBadge.name}</h3>
                      <p className="text-gray-400 mb-6">{selectedBadge.desc}</p>
                      
                      {!stats.badges.includes(selectedBadge.id) && (selectedBadge.reqXp || selectedBadge.reqLevel || selectedBadge.reqStreak) && (
                        <div className="w-full bg-black/40 rounded-lg p-4 border border-white/5 mb-6">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span><span>{Math.floor(calculateProgress(selectedBadge))}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-neon-blue transition-all duration-1000" style={{ width: `${calculateProgress(selectedBadge)}%` }}></div>
                            </div>
                            <div className="text-center text-[10px] text-gray-500 mt-1">{getProgressLabel(selectedBadge)}</div>
                        </div>
                      )}
                  </div>
              </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-neon-card to-black p-8 rounded-2xl border-l-4 border-neon-blue shadow-2xl relative overflow-hidden animate-slide-in-right preserve-3d transform hover:translate-z-10 transition-transform duration-500">
            <div className="absolute top-0 right-0 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="relative z-10">
                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome back, Cadet.</h2>
                <p className="text-gray-400 max-w-xl text-lg">Your neural link is active. Select a training module to begin your journey.</p>
            </div>
            
            {/* Stats Bar */}
            <div className="mt-8 flex items-center gap-8 relative z-10">
                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                    <Flame className="text-orange-500 fill-orange-500" size={24} />
                    <div>
                        <div className="text-2xl font-bold text-white leading-none">{stats.streak}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Day Streak</div>
                    </div>
                </div>
                 <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                    <Award className="text-yellow-500 fill-yellow-500" size={24} />
                    <div>
                        <div className="text-2xl font-bold text-white leading-none">{stats.badges.length}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Badges</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-white/5 cursor-pointer hover:bg-black/60 transition-colors" onClick={() => changeMode(GameMode.SHOP)}>
                    <ShoppingBag className="text-neon-pink" size={24} />
                    <div>
                        <div className="text-2xl font-bold text-white leading-none">{stats.xp} XP</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Credit</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Daily Mission Card */}
        <div className="animate-fade-in-up delay-75 preserve-3d">
             <div className="flex items-center gap-2 mb-4 text-white font-bold text-xl"><Calendar className="text-yellow-500" /> Daily Protocol</div>
             <div 
                onClick={() => !dailyCompleted && changeMode(GameMode.DAILY_CHALLENGE)}
                className={`
                    relative p-6 rounded-xl border transition-all duration-300 group flex items-center justify-between shadow-lg preserve-3d
                    ${dailyCompleted ? 'bg-gray-900 border-gray-800 cursor-default opacity-60' : 'bg-black/40 backdrop-blur-md border-yellow-500/30 hover:border-yellow-500 cursor-pointer hover:translate-x-2 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]'}
                `}
             >
                 <div className="flex items-center gap-6">
                     <div className={`p-4 rounded-xl transition-colors duration-300 ${dailyCompleted ? 'bg-gray-800 text-gray-500' : 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black'}`}>
                         {dailyCompleted ? <Check size={40} /> : <Flame size={40} />}
                     </div>
                     <div>
                         <h3 className={`text-2xl font-bold transition-colors ${dailyCompleted ? 'text-gray-500' : 'text-white group-hover:text-yellow-500'}`}>
                            {dailyCompleted ? 'Mission Accomplished' : 'Daily Gauntlet'}
                         </h3>
                         <p className="text-gray-400">
                            {dailyCompleted ? 'Cooldown active. Return tomorrow.' : 'Complete 3 rapid-fire challenges to extend streak.'}
                         </p>
                     </div>
                 </div>
                 <div className="text-right">
                     {dailyCompleted ? (
                         <span className="text-xs font-bold text-gray-600 border border-gray-700 px-3 py-1 rounded">COMPLETE</span>
                     ) : (
                         <div className="flex flex-col items-end">
                             <span className="text-yellow-500 font-bold mb-1">+300 XP</span>
                             <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded animate-pulse">READY</span>
                         </div>
                     )}
                 </div>
             </div>
        </div>

        {/* Training Section */}
        <div className="animate-fade-in-up delay-100 preserve-3d">
             <div className="flex items-center gap-2 mb-4 text-white font-bold text-xl"><GraduationCap className="text-neon-pink" /> Training Grounds</div>
             <div 
                onClick={() => changeMode(GameMode.TUTORIAL)}
                className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-gray-700 hover:border-neon-pink cursor-pointer transition-all duration-300 group flex items-center justify-between shadow-lg hover:shadow-neon-pink/20 transform hover:translate-x-2"
             >
                 <div className="flex items-center gap-6">
                     <div className="p-4 bg-neon-pink/10 rounded-xl text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors duration-300">
                         <GraduationCap size={40} />
                     </div>
                     <div>
                         <h3 className="text-2xl font-bold text-white group-hover:text-neon-pink transition-colors">Interactive Tutorials</h3>
                         <p className="text-gray-400">Step-by-step guided missions. Start here.</p>
                     </div>
                 </div>
                 <div className="text-neon-pink opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-8 group-hover:translate-x-0">
                     <PlayCircle size={40} />
                 </div>
             </div>
        </div>

        {/* Game Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up delay-300 preserve-3d">
            <DashboardCard 
                title="Binary Blitzer" 
                desc="Convert decimal to binary."
                color="border-neon-blue"
                icon={<Cpu size={32} className="text-neon-blue" />}
                onClick={() => changeMode(GameMode.BINARY)}
            />
             <DashboardCard 
                title="Hex Hero" 
                desc="Hexadecimal translation."
                color="border-neon-purple"
                icon={<Shield size={32} className="text-neon-purple" />}
                onClick={() => changeMode(GameMode.HEX)}
            />
             <DashboardCard 
                title="Subnet Showdown" 
                desc="Calculate IPs and masks."
                color="border-neon-green"
                icon={<NetworkIcon className="w-8 h-8 text-neon-green" />}
                onClick={() => changeMode(GameMode.SUBNET)}
            />
             <DashboardCard 
                title="Packet Tracer" 
                desc="Route traffic via subnets."
                color="border-neon-blue"
                icon={<Globe size={32} className="text-white" />}
                onClick={() => changeMode(GameMode.PACKET_TRACER)}
            />
             <DashboardCard 
                title="Firewall Frenzy" 
                desc="Filter malicious traffic."
                color="border-red-500"
                icon={<Zap size={32} className="text-red-500" />}
                onClick={() => changeMode(GameMode.FIREWALL)}
            />
             <DashboardCard 
                title="Threat Hunter" 
                desc="Detect Phishing Emails."
                color="border-neon-blue"
                icon={<Search size={32} className="text-neon-blue" />}
                onClick={() => changeMode(GameMode.THREAT_HUNTER)}
            />
        </div>
    </div>
  );
};

const DashboardCard = ({ title, desc, color, icon, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`
            bg-black/60 backdrop-blur-sm p-8 rounded-2xl border-t-4 ${color} 
            hover:-translate-y-2 hover:bg-gray-900/80 transition-all duration-300 cursor-pointer 
            shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group relative overflow-hidden
            preserve-3d
        `}
    >
        <div className="mb-6 bg-gray-800/50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-inner">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">{title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
        <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0">
            <PlayCircle className="text-white" size={32} />
        </div>
    </div>
);

const NetworkIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>
);

export default App;
