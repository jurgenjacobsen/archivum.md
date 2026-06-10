import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Editor } from './components/Editor';
import { Modal } from './components/Modal';
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
import { ReadFile, SaveFile, GetSettings, SaveSettings, CheckForUpdates, GetInitialFile, PrintToPDF, ToggleDiscordRPC, OpenWorkspaceDialog } from '../wailsjs/go/main/App';
import { BrowserOpenURL } from '../wailsjs/runtime/runtime';
import { FolderOpen, Settings as SettingsIcon, Bold, Italic, Code, Copy, Save, Printer } from 'lucide-react';
import { ContextMenu } from './components/ContextMenu';

function App() {
  const [workspaceRoot, setWorkspaceRoot] = useState('');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [discordRPC, setDiscordRPC] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; options: any[] } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Check for initial file
  useEffect(() => {
    const checkInitialFile = async () => {
      try {
        const initial = await GetInitialFile();
        if (initial && initial.path) {
          setWorkspaceRoot(initial.parent);
          handleFileSelect(initial.path);
        }
      } catch (err) {
        console.error("Error checking for initial file:", err);
      }
    };
    checkInitialFile();
  }, []);

  // Check for updates
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const info = await CheckForUpdates();
        if (info.available) {
          showConfirm(
            "Update Available", 
            `A new version (${info.latestVersion}) is available. Would you like to download it now?`,
            () => {
              BrowserOpenURL(info.downloadUrl);
            }
          );
        }
      } catch (err) {
        console.error("Error checking for updates:", err);
      }
    };
    checkUpdates();
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await GetSettings(workspaceRoot);
        setAutoSave(settings.autoSave);
        setSyncScroll(settings.syncScroll);
        setDiscordRPC(settings.discordRPC);
        if (settings.sidebarWidth) setSidebarWidth(settings.sidebarWidth);
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    };
    loadSettings();
  }, [workspaceRoot]);

  const handleSetAutoSave = async (value: boolean) => {
    setAutoSave(value);
    try {
      await SaveSettings({ autoSave: value, syncScroll, discordRPC, sidebarWidth }, workspaceRoot);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handleSetSyncScroll = async (value: boolean) => {
    setSyncScroll(value);
    try {
      await SaveSettings({ autoSave, syncScroll: value, discordRPC, sidebarWidth }, workspaceRoot);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handleSetDiscordRPC = async (value: boolean) => {
    setDiscordRPC(value);
    try {
      await SaveSettings({ autoSave, syncScroll, discordRPC: value, sidebarWidth }, workspaceRoot);
      await ToggleDiscordRPC(value);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handleSetSidebarWidth = async (width: number) => {
    setSidebarWidth(width);
    try {
      await SaveSettings({ autoSave, syncScroll, discordRPC, sidebarWidth: width }, workspaceRoot);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    if (isResizing) {
      setIsResizing(false);
      handleSetSidebarWidth(sidebarWidth);
    }
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, sidebarWidth]);
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    type: 'alert' | 'confirm';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save logic
  useEffect(() => {
    if (!autoSave || !activeFile) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [content, autoSave, activeFile]);

  const showAlert = useCallback((title: string, message: string) => {
    setModal({ isOpen: true, title, message, type: 'alert' });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setModal({ isOpen: true, title, message, onConfirm, type: 'confirm' });
  }, []);

  const handleFileSelect = useCallback(async (path: string) => {
    if (path.toLowerCase().endsWith('.md')) {
      try {
        setIsLoadingFile(true);
        const fileContent = await ReadFile(path);
        setActiveFile(path);
        setContent(fileContent);
      } catch (err) {
        showAlert("Error", "Could not read file.");
        console.error("Error reading file:", err);
      } finally {
        setIsLoadingFile(false);
      }
    }
  }, [showAlert]);

  const handleFileRename = useCallback((oldPath: string, newPath: string) => {
    if (activeFile === oldPath) {
      setActiveFile(newPath);
    }
  }, [activeFile]);

  const handleFileDelete = useCallback((path: string) => {
    if (activeFile === path) {
      setActiveFile(null);
      setContent('');
    }
  }, [activeFile]);

  const handleSave = async (isAuto = false) => {
    if (activeFile) {
      try {
        if (isAuto) setIsAutoSaving(true);
        else setIsSaving(true);

        await SaveFile(activeFile, content);
        
        setTimeout(() => {
          setIsSaving(false);
          setIsAutoSaving(false);
        }, 2000);
      } catch (err) {
        showAlert("Save Error", "Failed to save file.");
        console.error("Error saving file:", err);
        setIsSaving(false);
        setIsAutoSaving(false);
      }
    }
  };

  const handlePrint = async () => {
    if (!activeFile) return;
    const filename = activeFile.split(/[\\/]/).pop() || '';
    try {
      setIsPrinting(true);
      await PrintToPDF(content, filename);
      setIsPrinting(false);
    } catch (err) {
      setIsPrinting(false);
      showAlert("Print Error", "Failed to generate PDF.");
      console.error("Error generating PDF:", err);
    }
  };

  const handleFormat = (type: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold': 
        newText = `**${selectedText}**`; 
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic': 
        newText = `*${selectedText}*`; 
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'h1': 
        newText = `\n# ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'h2': 
        newText = `\n## ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'h3': 
        newText = `\n### ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'ul': 
        newText = `\n- ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'ol': 
        newText = `\n1. ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'todo': 
        newText = `\n- [ ] ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'quote': 
        newText = `\n> ${selectedText}`; 
        cursorOffset = newText.length;
        break;
      case 'code': 
        newText = `\`\`\`\n${selectedText}\n\`\`\``; 
        cursorOffset = selectedText ? newText.length : 4;
        break;
      default: return;
    }

    const updatedContent = content.substring(0, start) + newText + content.substring(end);
    setContent(updatedContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  const openWelcomeContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        {
          label: 'Open Folder',
          icon: <FolderOpen size={14} />,
          onClick: async () => {
            try {
              const path = await OpenWorkspaceDialog();
              if (path) {
                setWorkspaceRoot(path);
              }
            } catch (err) {
              console.error("Failed to open workspace:", err);
            }
          }
        },
        {
          label: 'Settings',
          icon: <SettingsIcon size={14} />,
          onClick: () => setShowSettings(true)
        }
      ]
    });
  };

  const openToolbarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        ...(activeFile ? [
          {
            label: 'Save File',
            icon: <Save size={14} />,
            onClick: () => handleSave()
          },
          {
            label: 'Print to PDF',
            icon: <Printer size={14} />,
            onClick: () => handlePrint()
          }
        ] : []),
        {
          label: 'Settings',
          icon: <SettingsIcon size={14} />,
          onClick: () => setShowSettings(true)
        }
      ]
    });
  };

  const openEditorContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        {
          label: 'Bold',
          icon: <Bold size={14} />,
          onClick: () => handleFormat('bold')
        },
        {
          label: 'Italic',
          icon: <Italic size={14} />,
          onClick: () => handleFormat('italic')
        },
        {
          label: 'Code Block',
          icon: <Code size={14} />,
          onClick: () => handleFormat('code')
        },
        {
          label: 'Save File',
          icon: <Save size={14} />,
          onClick: () => handleSave()
        },
        {
          label: 'Print to PDF',
          icon: <Printer size={14} />,
          onClick: () => handlePrint()
        },
        {
          label: 'Settings',
          icon: <SettingsIcon size={14} />,
          onClick: () => setShowSettings(true)
        }
      ]
    });
  };

  const openPreviewContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      options: [
        {
          label: 'Copy Markdown',
          icon: <Copy size={14} />,
          onClick: () => {
            navigator.clipboard.writeText(content);
          }
        },
        {
          label: 'Print to PDF',
          icon: <Printer size={14} />,
          onClick: () => handlePrint()
        },
        {
          label: 'Settings',
          icon: <SettingsIcon size={14} />,
          onClick: () => setShowSettings(true)
        }
      ]
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#242424] font-sans antialiased">
      <div 
        className="no-print h-full flex-shrink-0 relative"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Sidebar 
          workspaceRoot={workspaceRoot} 
          setWorkspaceRoot={setWorkspaceRoot} 
          onFileSelect={(path) => {
            setShowSettings(false);
            handleFileSelect(path);
          }} 
          onFileRename={handleFileRename} 
          onFileDelete={handleFileDelete}
          showConfirm={showConfirm}
          onOpenSettings={() => setShowSettings(true)}
          onResizeStart={startResizing}
        />
      </div>
      
      <div className="flex-grow flex flex-col overflow-hidden">
        {showSettings ? (
          <Suspense fallback={
            <div className="flex-grow flex flex-col items-center justify-center bg-white text-[#242424]">
              <div className="border-[6px] border-[#242424] p-6 text-center animate-pulse">
                <div className="welcome font-black text-xl uppercase tracking-widest text-[#242424]">Loading Settings...</div>
              </div>
            </div>
          }>
            <Settings 
              onClose={() => setShowSettings(false)}
              autoSave={autoSave}
              setAutoSave={handleSetAutoSave}
              syncScroll={syncScroll}
              setSyncScroll={handleSetSyncScroll}
              discordRPC={discordRPC}
              setDiscordRPC={handleSetDiscordRPC}
              sidebarWidth={sidebarWidth}
              setSidebarWidth={handleSetSidebarWidth}
            />
          </Suspense>
        ) : (
          <>
            <div className="no-print">
              <Toolbar 
                onFormat={handleFormat} 
                onSave={handleSave} 
                onPrint={handlePrint}
                activeFile={activeFile} 
                autoSave={autoSave}
                setAutoSave={handleSetAutoSave}
                isSaving={isSaving}
                isAutoSaving={isAutoSaving}
                isPrinting={isPrinting}
                syncScroll={syncScroll}
                setSyncScroll={handleSetSyncScroll}
                onContextMenu={openToolbarContextMenu}
              />
            </div>
            
            {isLoadingFile ? (
              <div className="flex-grow flex flex-col items-center justify-center bg-white text-[#242424] no-print">
                <div className="border-[12px] border-[#242424] p-12 text-center animate-pulse">
                  <div className="welcome font-black text-2xl uppercase tracking-widest text-[#242424]">Opening file...</div>
                </div>
              </div>
            ) : activeFile ? (
              <Editor 
                content={content} 
                setContent={setContent} 
                textareaRef={textareaRef} 
                previewRef={previewRef}
                syncScroll={syncScroll}
                onEditorContextMenu={openEditorContextMenu}
                onPreviewContextMenu={openPreviewContextMenu}
              />
            ) : (
              <div 
                className="flex-grow flex items-center justify-center bg-white text-[#242424] flex-col p-12 select-none no-print"
                onContextMenu={openWelcomeContextMenu}
              >
                <div className="border-[12px] border-[#242424] p-12 text-center inline-flex items-center space-x-12">
                    <img src="/icon.png" className='max-h-32 aspect-square' />
                    <div>
                        <h1 className="welcome font-black mb-6 tracking-tighter leading-none">
                            <span className='serif text-5xl opacity-50'>Archivum</span>
                            <span className='sans text-5xl text-[#242424]'>.md</span>
                        </h1>
                        <div className="h-2 bg-[#242424] w-24 mx-auto mb-6"></div>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold leading-loose text-gray-400">
                            Open a workspace to begin<br/>archiving your thoughts.
                        </p>
                    </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={contextMenu.options}
        />
      )}
    </div>
  );
}

export default App;
