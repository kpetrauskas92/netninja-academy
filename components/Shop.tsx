
import React, { useState } from 'react';
import { ShopItem, PlayerStats } from '../types';
import { ShoppingBag, Check, Lock, Layout, User, Zap, Clock } from 'lucide-react';

interface ShopProps {
  stats: PlayerStats;
  onPurchase: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  onExit: () => void;
}

export const SHOP_ITEMS: ShopItem[] = [
  // --- Themes ---
  {
    id: 'theme_default',
    type: 'theme',
    name: 'Cyber Core',
    description: 'The standard issue NetNinja interface.',
    price: 0,
    icon: '🔵',
    config: {
        '--neon-blue': '#00f3ff',
        '--neon-purple': '#bc13fe',
        '--neon-green': '#0aff0a',
        '--neon-pink': '#ff00ff',
        '--neon-dark': '#050508',
        '--neon-card': '#13131f'
    }
  },
  {
    id: 'theme_matrix',
    type: 'theme',
    name: 'The Source',
    description: 'Everything is code. Green phosphor aesthetic.',
    price: 1000,
    icon: '🟢',
    config: {
        '--neon-blue': '#00ff00',
        '--neon-purple': '#003300',
        '--neon-green': '#33ff33',
        '--neon-pink': '#ccffcc',
        '--neon-dark': '#000000',
        '--neon-card': '#001100'
    }
  },
  {
    id: 'theme_vapor',
    type: 'theme',
    name: 'Vaporwave',
    description: 'Sunset vibes and retro synths.',
    price: 1500,
    icon: '🌸',
    config: {
        '--neon-blue': '#00ffff',
        '--neon-purple': '#ff77ff',
        '--neon-green': '#ffcc00',
        '--neon-pink': '#ff99cc',
        '--neon-dark': '#1a0a2e',
        '--neon-card': '#2d1b4e'
    }
  },
  {
    id: 'theme_gold',
    type: 'theme',
    name: 'Golden Legacy',
    description: 'For the elite. Pure luxury.',
    price: 3000,
    icon: '👑',
    config: {
        '--neon-blue': '#ffd700',
        '--neon-purple': '#b8860b',
        '--neon-green': '#ffffff',
        '--neon-pink': '#ffcc00',
        '--neon-dark': '#111111',
        '--neon-card': '#1a1a1a'
    }
  },
  // --- Avatars ---
  { id: 'av_robot', type: 'avatar', name: 'Droid Unit', description: 'Standard issue bot.', price: 0, icon: '🤖' },
  { id: 'av_ninja', type: 'avatar', name: 'Shadow Ops', description: 'Stealth mode engaged.', price: 500, icon: '🥷' },
  { id: 'av_alien', type: 'avatar', name: 'Star Walker', description: 'From a galaxy far away.', price: 800, icon: '👽' },
  { id: 'av_skull', type: 'avatar', name: 'Net Lich', description: 'Undead coding wizard.', price: 1200, icon: '💀' },
  // --- Upgrades ---
  {
    id: 'time_dilation',
    type: 'upgrade',
    name: 'No Time :)',
    description: 'For those who have lots of time wink wink',
    price: 5000,
    icon: '⏳'
  }
];

const Shop: React.FC<ShopProps> = ({ stats, onPurchase, onEquip, onExit }) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'avatar' | 'upgrade'>('theme');

  const filteredItems = SHOP_ITEMS.filter(item => item.type === activeTab);

  const handlePurchaseClick = (item: ShopItem) => {
    if (stats.inventory.includes(item.id)) return;
    if (stats.xp >= item.price) {
        onPurchase(item);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 pt-4 md:pt-12 h-full preserve-3d">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end w-full preserve-3d border-b border-white/10 pb-4">
        <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <ShoppingBag className="text-neon-pink" size={32} /> <span className="hidden md:inline">Cyber Deck</span> Store
            </h2>
            <p className="text-gray-400 text-sm md:text-base">Upgrade your neural interface.</p>
        </div>
        <div className="text-right">
             <div className="text-[10px] md:text-sm text-gray-500 uppercase font-bold">Available Credit</div>
             <div className="text-xl md:text-3xl font-mono font-bold text-neon-green">{stats.xp} XP</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 preserve-3d w-full justify-start md:justify-center overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('theme')} 
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'theme' ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Layout size={18} /> Themes
          </button>
          <button 
            onClick={() => setActiveTab('avatar')} 
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'avatar' ? 'bg-neon-purple text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <User size={18} /> Avatars
          </button>
          <button 
            onClick={() => setActiveTab('upgrade')} 
            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'upgrade' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Zap size={18} /> Upgrades
          </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full preserve-3d pb-20">
          {filteredItems.map((item, idx) => {
              const isOwned = stats.inventory.includes(item.id);
              const isEquipped = stats.equipped.theme === item.id || stats.equipped.avatar === item.id;
              const canAfford = stats.xp >= item.price;

              return (
                  <div 
                    key={item.id} 
                    className={`
                        bg-black/60 backdrop-blur-xl border p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-2
                        ${isEquipped ? 'border-neon-green shadow-[0_0_20px_rgba(10,255,10,0.2)]' : 'border-gray-700 hover:border-white'}
                    `}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                      {/* Icon/Preview */}
                      <div className="h-32 mb-6 rounded-xl bg-gray-900/50 flex items-center justify-center text-6xl relative overflow-hidden border border-white/5">
                          {item.type === 'theme' && (
                              <div className="absolute inset-0 grid grid-cols-2">
                                  <div style={{background: item.config['--neon-dark']}}></div>
                                  <div style={{background: item.config['--neon-card']}}></div>
                                  <div style={{background: item.config['--neon-blue']}}></div>
                                  <div style={{background: item.config['--neon-pink']}}></div>
                              </div>
                          )}
                          <span className="relative z-10 drop-shadow-lg">{item.icon}</span>
                      </div>

                      <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{item.name}</h3>
                          {isEquipped && <span className="bg-neon-green/20 text-neon-green text-xs px-2 py-1 rounded font-bold border border-neon-green/50">ACTIVE</span>}
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{item.description}</p>

                      <div className="flex justify-between items-center">
                          <div className="font-mono font-bold">
                              {isOwned ? (
                                  <span className="text-gray-500">PURCHASED</span>
                              ) : (
                                  <span className={canAfford ? 'text-neon-blue' : 'text-red-500'}>{item.price} XP</span>
                              )}
                          </div>

                          {isOwned ? (
                              item.type !== 'upgrade' && (
                                <button 
                                    onClick={() => onEquip(item)}
                                    disabled={isEquipped}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isEquipped ? 'bg-gray-800 text-gray-600 cursor-default' : 'bg-white text-black hover:bg-gray-200'}`}
                                >
                                    {isEquipped ? 'Equipped' : 'Equip'}
                                </button>
                              )
                          ) : (
                              <button 
                                onClick={() => handlePurchaseClick(item)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${canAfford ? 'bg-neon-blue text-black hover:scale-105' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                              >
                                {canAfford ? 'Buy Now' : 'Locked'} {!canAfford && <Lock size={14} />}
                              </button>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>
      
      <button onClick={onExit} className="mt-4 text-gray-500 hover:text-white underline md:hidden pb-10">Return to Dashboard</button>
    </div>
  );
};

export default Shop;
