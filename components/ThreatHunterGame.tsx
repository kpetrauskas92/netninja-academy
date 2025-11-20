
import React, { useState, useEffect } from 'react';
import { Shield, Mail, FileText, ExternalLink, AlertTriangle, CheckCircle, XCircle, Search, Lock } from 'lucide-react';

interface ThreatHunterGameProps {
  addXP: (amount: number) => void;
}

interface Email {
  id: number;
  sender: string;
  subject: string;
  body: string;
  attachment?: string;
  linkText?: string;
  linkUrl?: string;
  isPhishing: boolean;
  reason: string; // Why it is phishing (or safe)
}

const ThreatHunterGame: React.FC<ThreatHunterGameProps> = ({ addXP }) => {
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect', msg: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- Generators ---
  
  const generateEmail = (): Email => {
    const isPhish = Math.random() > 0.5;
    const id = Date.now();

    const safeDomains = ['google.com', 'microsoft.com', 'netflix.com', 'amazon.com', 'paypal.com', 'hr-portal.internal'];
    const users = ['security', 'billing', 'support', 'admin', 'hr-team'];
    
    const templates = [
        {
            subject: 'Urgent: Account Suspended',
            body: 'We detected unusual activity on your account. Please verify your identity immediately.',
            linkText: 'Verify Now',
            linkSafe: 'https://www.paypal.com/auth/login',
            linkPhish: 'http://www.paypa1-secure-login.com/auth',
            senderName: 'PayPal Security'
        },
        {
            subject: 'Invoice #39281 Overdue',
            body: 'Please find attached the invoice for services rendered. Payment is required within 24 hours.',
            attachmentSafe: 'Invoice_39281.pdf',
            attachmentPhish: 'Invoice_39281_DETAILS.exe',
            senderName: 'Billing Dept'
        },
        {
            subject: 'New Sign-in Detected',
            body: 'A new device signed in to your account from Russia. Was this you?',
            linkText: 'Review Activity',
            linkSafe: 'https://myaccount.google.com/notifications',
            linkPhish: 'http://google-security-check.net/login',
            senderName: 'Google Alerts'
        },
        {
            subject: 'Employee Bonus Plan',
            body: 'Attached is the breakdown for the Q4 bonus structure. Confidential.',
            attachmentSafe: 'Q4_Bonus_Plan.docx',
            attachmentPhish: 'Q4_Bonus_Plan.js', // Malicious script
            senderName: 'HR Team'
        }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    
    if (isPhish) {
        // Malicious Logic
        let reason = '';
        let sender = '';
        let linkUrl = undefined;
        let attachment = undefined;

        const trickType = Math.floor(Math.random() * 3); // 0: Bad Domain, 1: Bad Link, 2: Bad Attachment

        if (trickType === 0 || (!t.linkPhish && !t.attachmentPhish)) {
            // Spoof Sender
            const domain = safeDomains[Math.floor(Math.random() * safeDomains.length)];
            const badDomain = domain.replace('o', '0').replace('l', '1').replace('i', 'l');
            sender = `${t.senderName.toLowerCase().replace(' ', '.')}@${badDomain}`;
            reason = `Sender domain "${badDomain}" is a typosquat of "${domain}".`;
            linkUrl = t.linkSafe; // Link might actually look real, but sender is bad
            attachment = t.attachmentSafe;
        } else if (trickType === 1 && t.linkPhish) {
            // Bad Link
            sender = `${t.senderName.toLowerCase().replace(' ', '.')}@${safeDomains[Math.floor(Math.random() * safeDomains.length)]}`;
            linkUrl = t.linkPhish;
            reason = `Link destination "${t.linkPhish}" does not match the official domain.`;
            attachment = t.attachmentSafe;
        } else {
            // Bad Attachment
            sender = `${t.senderName.toLowerCase().replace(' ', '.')}@${safeDomains[Math.floor(Math.random() * safeDomains.length)]}`;
            linkUrl = t.linkSafe;
            attachment = t.attachmentPhish;
            reason = `Attachment has a dangerous extension (${t.attachmentPhish?.split('.').pop()}).`;
        }

        return {
            id,
            sender,
            subject: t.subject,
            body: t.body,
            linkText: t.linkText,
            linkUrl,
            attachment,
            isPhishing: true,
            reason
        };

    } else {
        // Safe Logic
        const domain = safeDomains[Math.floor(Math.random() * safeDomains.length)];
        return {
            id,
            sender: `${t.senderName.toLowerCase().replace(' ', '.')}@${domain}`,
            subject: t.subject,
            body: t.body,
            linkText: t.linkText,
            linkUrl: t.linkSafe,
            attachment: t.attachmentSafe,
            isPhishing: false,
            reason: 'Sender domain is trusted, links match, and attachments are safe types.'
        };
    }
  };

  useEffect(() => {
    setCurrentEmail(generateEmail());
  }, []);

  const handleDecision = (decision: 'safe' | 'phish') => {
      if (!currentEmail || isAnimating) return;

      const correct = (decision === 'phish' && currentEmail.isPhishing) || (decision === 'safe' && !currentEmail.isPhishing);
      
      if (correct) {
          const xp = 50 + (streak * 10);
          setScore(s => s + xp);
          setStreak(s => s + 1);
          addXP(xp);
          setFeedback({ type: 'correct', msg: decision === 'phish' ? 'Threat Neutralized' : 'Traffic Cleared' });
      } else {
          setStreak(0);
          setFeedback({ type: 'incorrect', msg: currentEmail.reason });
      }

      setIsAnimating(true);
      setTimeout(() => {
          setCurrentEmail(generateEmail());
          setFeedback(null);
          setIsAnimating(false);
      }, 2000);
  };

  if (!currentEmail) return null;

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-4 pt-12 h-full preserve-3d">
        {/* Header */}
        <div className="mb-8 text-center preserve-3d w-full">
             <h2 className="text-5xl font-mono font-bold text-white mb-2 flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
                <Search size={48} className="text-neon-blue" /> THREAT HUNTER
            </h2>
            <p className="text-gray-400">Analyze incoming messages. Identify phishing attempts and malicious payloads.</p>
            <div className="mt-4 inline-flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/10">
                <div className="text-neon-green font-bold font-mono">SCORE: {score}</div>
                <div className="w-px h-4 bg-gray-700"></div>
                <div className={`${streak > 2 ? 'text-yellow-500 animate-pulse' : 'text-gray-400'} font-bold font-mono`}>STREAK: {streak}x</div>
            </div>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-2xl perspective-1000 relative">
            
            {/* Feedback Overlay */}
            {feedback && (
                <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm rounded-2xl transition-opacity duration-300 ${feedback.type === 'correct' ? 'bg-neon-green/10' : 'bg-red-500/10'}`}>
                    <div className={`p-8 rounded-2xl border-2 shadow-2xl transform scale-110 text-center max-w-md bg-black/90 ${feedback.type === 'correct' ? 'border-neon-green shadow-neon-green/20' : 'border-red-500 shadow-red-500/20'}`}>
                        {feedback.type === 'correct' ? <CheckCircle size={64} className="mx-auto mb-4 text-neon-green" /> : <AlertTriangle size={64} className="mx-auto mb-4 text-red-500" />}
                        <h3 className="text-2xl font-bold text-white mb-2">{feedback.type === 'correct' ? 'EXCELLENT WORK' : 'BREACH DETECTED'}</h3>
                        <p className="text-gray-300">{feedback.msg}</p>
                    </div>
                </div>
            )}

            {/* Email Card */}
            <div className={`
                bg-white text-black rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 border-t-8 border-neon-blue
                ${isAnimating ? 'opacity-0 translate-y-10 rotate-x-12' : 'opacity-100 translate-y-0 rotate-x-0'}
            `}>
                {/* Email Header */}
                <div className="bg-gray-100 p-6 border-b border-gray-200">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-600">
                            {currentEmail.sender[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-900">{currentEmail.subject}</h3>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                From: <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-800">{currentEmail.sender}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">To: you@netninja.corp</div>
                        </div>
                    </div>
                </div>

                {/* Email Body */}
                <div className="p-8 min-h-[200px]">
                    <p className="text-gray-800 text-lg leading-relaxed mb-8">{currentEmail.body}</p>
                    
                    {currentEmail.linkText && (
                        <div className="mb-6">
                            <div className="group relative inline-block">
                                <a className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
                                    {currentEmail.linkText} <ExternalLink size={16} />
                                </a>
                                {/* URL Reveal Tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded font-mono z-10">
                                    {currentEmail.linkUrl}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                                <Search size={12} /> Hover button to inspect link destination
                            </div>
                        </div>
                    )}

                    {currentEmail.attachment && (
                        <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-4 bg-gray-50">
                            <FileText size={32} className="text-gray-500" />
                            <div>
                                <div className="font-bold text-gray-700">{currentEmail.attachment}</div>
                                <div className="text-xs text-gray-500">1.2 MB</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 border-t border-gray-200">
                    <button 
                        onClick={() => handleDecision('phish')}
                        className="p-6 flex flex-col items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 transition-colors border-r border-gray-200 group"
                    >
                        <AlertTriangle size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wider">QUARANTINE</span>
                    </button>
                    <button 
                        onClick={() => handleDecision('safe')}
                        className="p-6 flex flex-col items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 transition-colors group"
                    >
                        <CheckCircle size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold tracking-wider">APPROVE</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm max-w-md">
            <p>Analyze the <span className="text-gray-300">Sender Domain</span>, <span className="text-gray-300">Link URLs</span>, and <span className="text-gray-300">Attachment Types</span> before deciding.</p>
        </div>
    </div>
  );
};

export default ThreatHunterGame;
