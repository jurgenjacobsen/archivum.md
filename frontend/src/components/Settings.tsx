import { Settings as SettingsIcon, X, Zap, MoveVertical, MessageSquare } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  syncScroll: boolean;
  setSyncScroll: (value: boolean) => void;
  discordRPC: boolean;
  setDiscordRPC: (value: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (value: number) => void;
}

export const Settings = ({ 
    onClose, 
    autoSave, 
    setAutoSave, 
    syncScroll, 
    setSyncScroll,
    discordRPC,
    setDiscordRPC,
    sidebarWidth,
    setSidebarWidth
}: SettingsProps) => {
  return (
    <div className="flex-grow flex flex-col bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="h-12 min-h-[48px] max-h-[48px] border-b border-[#242424] flex items-center justify-between px-6 bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <SettingsIcon size={18} />
          <h2 className="text-xs uppercase font-black tracking-widest">Settings</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-[#242424] hover:text-white transition-colors rounded-sm"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-8 max-w-2xl mx-auto w-full">
        <section className="mb-10">
          <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">General</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Zap size={16} />
                  <h4 className="text-sm font-bold uppercase tracking-tight">Auto-save</h4>
                </div>
                <p className="text-xs text-gray-500 max-w-md">Automatically save changes to your files after a brief period of inactivity.</p>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${autoSave ? 'bg-[#242424]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${autoSave ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between group">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <MoveVertical size={16} />
                  <h4 className="text-sm font-bold uppercase tracking-tight">Sync Scroll</h4>
                </div>
                <p className="text-xs text-gray-500 max-w-md">Synchronize scrolling between the editor and the preview pane.</p>
              </div>
              <button
                onClick={() => setSyncScroll(!syncScroll)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${syncScroll ? 'bg-[#242424]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${syncScroll ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">Appearance</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <MoveVertical size={16} className="rotate-90" />
                  <h4 className="text-sm font-bold uppercase tracking-tight">Sidebar Width</h4>
                </div>
                <p className="text-xs text-gray-500 max-w-md">Reset the sidebar to its default width.</p>
              </div>
              <button
                onClick={() => setSidebarWidth(256)}
                className="px-4 py-2 border border-[#242424] text-[10px] uppercase font-bold hover:bg-[#242424] hover:text-white transition-all"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mb-6 border-b border-gray-100 pb-2">Integrations</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <MessageSquare size={16} />
                  <h4 className="text-sm font-bold uppercase tracking-tight">Discord Rich Presence</h4>
                </div>
                <p className="text-xs text-gray-500 max-w-md">Display your current editing activity on your Discord profile.</p>
              </div>
              <button
                onClick={() => setDiscordRPC(!discordRPC)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${discordRPC ? 'bg-[#242424]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${discordRPC ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <div className="mt-12 pt-12 border-t border-gray-100 text-center">
          <div className="inline-block border-[6px] border-[#242424] p-6 text-center">
            <h1 className="welcome font-black mb-2 tracking-tighter leading-none">
              <span className='serif text-xl opacity-50'>Archivum</span><br/>
              <span className='sans text-3xl text-[#242424]'>Markdown</span>
            </h1>
            <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-gray-400">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
