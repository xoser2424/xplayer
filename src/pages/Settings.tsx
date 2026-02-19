import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Monitor, Wifi, User, Bell, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'account', label: 'Account', icon: User },
    { id: 'player', label: 'Player & Stream', icon: Monitor },
    { id: 'parental', label: 'Parental Control', icon: Shield },
    { id: 'connection', label: 'Connection', icon: Wifi },
  ];

  return (
    <div className="h-full flex gap-8">
      {/* Settings Sidebar */}
      <div className="w-64 flex flex-col gap-2">
        <h1 className="text-2xl font-serif font-bold text-white mb-6 px-2">Settings</h1>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
              activeSection === section.id
                ? "bg-gold text-black shadow-gold-glow"
                : "text-text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <section.icon size={18} />
            <span>{section.label}</span>
            {activeSection === section.id && <ChevronRight size={16} className="ml-auto" />}
          </button>
        ))}
      </div>

      {/* Settings Content Panel */}
      <div className="flex-1 bg-panel/50 border border-white/5 rounded-2xl p-8 overflow-y-auto">
        {activeSection === 'general' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Application Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <div className="text-white font-medium">Language</div>
                    <div className="text-text-muted text-xs">Select your preferred interface language</div>
                  </div>
                  <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-gold/50">
                    <option value="en">English</option>
                    <option value="tr">Türkçe</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <div className="text-white font-medium">Auto-Start</div>
                    <div className="text-text-muted text-xs">Launch XPlayer when computer starts</div>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle-autostart" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                    <label htmlFor="toggle-autostart" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'player' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Playback Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <div className="text-white font-medium">Hardware Acceleration</div>
                    <div className="text-text-muted text-xs">Use GPU for smoother playback (Restart required)</div>
                  </div>
                  <button className="bg-gold/20 text-gold px-3 py-1 rounded text-xs font-bold uppercase">Enabled</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <div className="text-white font-medium">Default Buffer Size</div>
                    <div className="text-text-muted text-xs">Increase for slower connections</div>
                  </div>
                  <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-gold/50">
                    <option value="small">Small (Low Latency)</option>
                    <option value="normal" selected>Normal</option>
                    <option value="large">Large (Smoother)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div>
                    <div className="text-white font-medium">Stream Format</div>
                    <div className="text-text-muted text-xs">Preferred streaming protocol</div>
                  </div>
                  <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-gold/50">
                    <option value="hls" selected>HLS (Adaptive)</option>
                    <option value="mpegts">MPEG-TS</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'parental' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Parental Controls</h2>
              <div className="p-6 bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <Shield size={32} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Parental PIN is Disabled</h3>
                  <p className="text-text-muted text-sm mt-1 max-w-md">Secure adult content and restrict access to specific categories by enabling a 4-digit PIN code.</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Set PIN Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
