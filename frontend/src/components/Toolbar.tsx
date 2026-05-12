import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Save, Check, Zap, ZapOff, Loader2, CheckSquare, MoveVertical, Printer } from 'lucide-react';

interface ToolbarProps {
  onFormat: (type: string) => void;
  onSave: () => void;
  onPrint: () => void;
  activeFile: string | null;
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  isSaving: boolean;
  isAutoSaving: boolean;
  isPrinting: boolean;
  syncScroll: boolean;
  setSyncScroll: (value: boolean) => void;
}

export const Toolbar = ({ 
  onFormat, 
  onSave, 
  onPrint,
  activeFile, 
  autoSave, 
  setAutoSave, 
  isSaving, 
  isAutoSaving,
  isPrinting,
  syncScroll,
  setSyncScroll
}: ToolbarProps) => {
  const buttons = [
    { icon: Bold, type: 'bold', title: 'Bold' },
    { icon: Italic, type: 'italic', title: 'Italic' },
    { icon: Heading1, type: 'h1', title: 'Heading 1' },
    { icon: Heading2, type: 'h2', title: 'Heading 2' },
    { icon: Heading3, type: 'h3', title: 'Heading 3' },
    { icon: List, type: 'ul', title: 'Unordered List' },
    { icon: ListOrdered, type: 'ol', title: 'Ordered List' },
    { icon: CheckSquare, type: 'todo', title: 'Checklist' },
    { icon: Quote, type: 'quote', title: 'Blockquote' },
    { icon: Code, type: 'code', title: 'Code Block' },
  ];

  return (
    <div className="h-12 min-h-[48px] max-h-[48px] border-b border-[#242424] flex items-center px-4 bg-white sticky top-0 z-10 select-none overflow-hidden">
      <div className="flex-grow flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {buttons.map((btn) => (
          <button
            key={btn.type}
            onClick={() => onFormat(btn.type)}
            className="p-1.5 hover:bg-[#242424] hover:text-white transition-colors rounded-sm flex-shrink-0"
            title={btn.title}
          >
            <btn.icon size={18} />
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0"></div>
        
        <button
          onClick={() => setAutoSave(!autoSave)}
          className={`py-1.5 px-4 transition-colors rounded-sm flex items-center space-x-1 flex-shrink-0 ${autoSave ? 'bg-[#242424] text-white' : 'hover:bg-[#242424] text-gray-400'}`}
          title={autoSave ? "Disable Auto-save" : "Enable Auto-save"}
        >
          {isAutoSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            autoSave ? <Zap size={16} /> : <ZapOff size={16} />
          )}
          <span className="text-[9px] uppercase font-bold px-1 whitespace-nowrap">Auto</span>
        </button>

        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`py-1.5 px-4 transition-colors rounded-sm flex items-center space-x-1 flex-shrink-0 ${syncScroll ? 'bg-[#242424] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
          title={syncScroll ? "Disable Scroll Sync" : "Enable Scroll Sync"}
        >
          <MoveVertical size={16} />
          <span className="text-[9px] uppercase font-bold px-1 whitespace-nowrap">Sync</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0"></div>

        <button
          onClick={onPrint}
          disabled={!activeFile || isPrinting}
          className="p-1.5 hover:bg-[#242424] hover:text-white transition-colors rounded-sm flex-shrink-0 disabled:opacity-20"
          title={isPrinting ? "Generating PDF..." : "Print to PDF/Printer"}
        >
          {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
        </button>
      </div>

      <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
        {activeFile && (
          <span className="text-[11px] text-gray-400 font-mono truncate max-w-[120px] hidden lg:block">
            {activeFile.split(/[\\/]/).pop()}
          </span>
        )}
        
        <button
          onClick={() => onSave()}
          disabled={!activeFile || isSaving || isAutoSaving}
          className={`flex items-center space-x-2 px-4 py-1.5 text-[11px] uppercase font-bold rounded-sm transition-all tracking-wider border border-[#242424] flex-shrink-0 ${
            isSaving 
              ? 'bg-white text-[#242424]' 
              : 'bg-[#242424] text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <Check size={14} />
              <span className="whitespace-nowrap">Saved</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span className="whitespace-nowrap">Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
