import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, File, ChevronRight, ChevronDown, FolderOpen, FilePlus, FolderPlus, Edit2, Trash2, GripVertical, Settings } from 'lucide-react';
import { GetDirectoryLevel, OpenWorkspaceDialog, CreateFile, CreateDirectory, Rename, Delete } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
}

interface SidebarProps {
  onFileSelect: (path: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
  onFileDelete: (path: string) => void;
  workspaceRoot: string;
  setWorkspaceRoot: (path: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onOpenSettings: () => void;
  onResizeStart: () => void;
}

const NewItemInput = ({ 
  onSubmit, 
  onCancel, 
  type,
  initialValue = ''
}: { 
  onSubmit: (name: string) => void, 
  onCancel: () => void, 
  type: 'file' | 'folder' | 'rename',
  initialValue?: string
}) => {
  const [name, setName] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (type === 'rename') {
      const dotIndex = initialValue.lastIndexOf('.');
      if (dotIndex > 0) {
        inputRef.current?.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current?.select();
      }
    }
  }, [type, initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      onSubmit(name.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center p-1 bg-white border border-[#242424] ml-4 mr-2 my-1">
      {type === 'folder' ? <Folder size={12} className="mr-1" /> : <File size={12} className="mr-1" />}
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        className="flex-grow outline-none text-xs"
        placeholder="Name..."
      />
    </div>
  );
};

const FileTreeItem = ({ 
  item, 
  onFileSelect, 
  onFileRename, 
  onFileDelete,
  showConfirm
}: { 
  item: FileNode, 
  onFileSelect: (path: string) => void,
  onFileRename: (oldPath: string, newPath: string) => void,
  onFileDelete: (path: string) => void,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);
  const [showNewInput, setShowNewInput] = useState<'file' | 'folder' | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const loadDirectory = useCallback(async () => {
    try {
      const result = await GetDirectoryLevel(item.path);
      setChildren(result || []);
    } catch (error) {
      console.error("Failed to load directory:", error);
      setChildren([]);
    }
  }, [item.path]);

  const toggleOpen = async () => {
    if (item.isDir) {
      if (!isOpen && (!children || children.length === 0)) {
        await loadDirectory();
      }
      setIsOpen(!isOpen);
    } else {
      onFileSelect(item.path);
    }
  };

  const handleCreateNew = async (name: string) => {
    const newPath = `${item.path}/${name}`;
    try {
      if (showNewInput === 'file') {
        await CreateFile(newPath);
        if (name.toLowerCase().endsWith('.md')) {
          onFileSelect(newPath);
        }
      } else {
        await CreateDirectory(newPath);
      }
      setShowNewInput(null);
      setIsOpen(true);
      await loadDirectory();
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const handleRename = async (newName: string) => {
    if (newName === item.name) {
      setIsRenaming(false);
      return;
    }
    const parentPath = item.path.substring(0, item.path.lastIndexOf(item.name));
    const newPath = `${parentPath}${newName}`;
    try {
      await Rename(item.path, newPath);
      onFileRename(item.path, newPath);
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Confirm Deletion", 
      `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
      async () => {
        try {
          await Delete(item.path);
          onFileDelete(item.path);
        } catch (error) {
          console.error("Failed to delete:", error);
        }
      }
    );
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", item.path);
    e.dataTransfer.setData("item-name", item.name);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (item.isDir) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!item.isDir) return;
    e.preventDefault();
    setIsDragOver(false);
    
    const sourcePath = e.dataTransfer.getData("text/plain");
    const itemName = e.dataTransfer.getData("item-name");
    
    if (!sourcePath || sourcePath === item.path) return;
    if (item.path.startsWith(sourcePath)) return;

    const newPath = `${item.path}/${itemName}`;
    
    try {
      await Rename(sourcePath, newPath);
      onFileRename(sourcePath, newPath);
      setIsOpen(true);
      await loadDirectory();
    } catch (error) {
      console.error("Failed to move item:", error);
    }
  };

  useEffect(() => {
    if (!isOpen || !item.isDir) return;

    const unsubscribe = EventsOn('workspace-update', (parentPath: string) => {
      if (parentPath === item.path) {
        loadDirectory();
      }
    });

    return () => unsubscribe();
  }, [isOpen, item.isDir, item.path, loadDirectory]);

  if (isRenaming) {
    return (
      <NewItemInput 
        type="rename" 
        initialValue={item.name} 
        onSubmit={handleRename} 
        onCancel={() => setIsRenaming(false)} 
      />
    );
  }

  return (
    <div className="ml-2">
      <div 
        className={`group flex items-center justify-between cursor-pointer p-1 text-sm select-none transition-colors ${isDragOver ? 'bg-[#242424] text-white' : 'hover:bg-gray-100'}`}
        onClick={toggleOpen}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center overflow-hidden">
          <GripVertical size={12} className="mr-1 opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing" />
          {item.isDir ? (
            <>
              {isOpen ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
              <Folder size={14} className={`mr-1 ${isDragOver ? 'fill-white' : 'fill-[#242424]'}`} />
            </>
          ) : (
            <File size={14} className="ml-4 mr-1" />
          )}
          <span className="truncate">{item.name}</span>
        </div>
        
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity pr-1 space-x-1">
          {item.isDir && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNewInput('file'); }}
                className={`p-0.5 rounded ${isDragOver ? 'hover:bg-white hover:text-[#242424]' : 'hover:bg-[#242424] hover:text-white'}`}
                title="New File"
              >
                <FilePlus size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNewInput('folder'); }}
                className={`p-0.5 rounded ${isDragOver ? 'hover:bg-white hover:text-[#242424]' : 'hover:bg-[#242424] hover:text-white'}`}
                title="New Folder"
              >
                <FolderPlus size={12} />
              </button>
            </>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
            className={`p-0.5 rounded ${isDragOver ? 'hover:bg-white hover:text-[#242424]' : 'hover:bg-[#242424] hover:text-white'}`}
            title="Rename"
          >
            <Edit2 size={12} />
          </button>
          <button 
            onClick={handleDelete}
            className={`p-0.5 rounded ${isDragOver ? 'hover:bg-white hover:text-[#242424]' : 'hover:bg-[#242424] hover:text-white'}`}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {showNewInput && (
        <NewItemInput 
          type={showNewInput} 
          onSubmit={handleCreateNew} 
          onCancel={() => setShowNewInput(null)} 
        />
      )}

      {isOpen && item.isDir && (
        <div className="border-l border-gray-300 ml-2">
          {children && children.length > 0 ? (
            children.map((child) => (
              <FileTreeItem 
                key={child.path} 
                item={child} 
                onFileSelect={onFileSelect} 
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
                showConfirm={showConfirm}
              />
            ))
          ) : (
            <div className="p-1 pl-6 text-xs text-gray-400 italic">Empty</div>
          )}
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ 
  onFileSelect, 
  onFileRename, 
  onFileDelete, 
  workspaceRoot, 
  setWorkspaceRoot,
  showConfirm,
  onOpenSettings,
  onResizeStart
}: SidebarProps) => {
  const [rootItems, setRootItems] = useState<FileNode[]>([]);
  const [showNewInput, setShowNewInput] = useState<'file' | 'folder' | null>(null);
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

  const loadRoot = useCallback(async (path: string) => {
    try {
      const items = await GetDirectoryLevel(path);
      setRootItems(items || []);
    } catch (error) {
      console.error("Failed to load root directory:", error);
      setRootItems([]);
    }
  }, []);

  const openWorkspace = async () => {
    try {
      const path = await OpenWorkspaceDialog();
      if (path) {
        setWorkspaceRoot(path);
        loadRoot(path);
      }
    } catch (error) {
      console.error("Failed to open workspace:", error);
    }
  };

  const handleCreateNew = async (name: string) => {
    const newPath = `${workspaceRoot}/${name}`;
    try {
      if (showNewInput === 'file') {
        await CreateFile(newPath);
        if (name.toLowerCase().endsWith('.md')) {
          onFileSelect(newPath);
        }
      } else {
        await CreateDirectory(newPath);
      }
      setShowNewInput(null);
      await loadRoot(workspaceRoot);
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    if (workspaceRoot) {
      e.preventDefault();
      setIsDragOverRoot(true);
    }
  };

  const handleDropRoot = async (e: React.DragEvent) => {
    if (!workspaceRoot) return;
    e.preventDefault();
    setIsDragOverRoot(false);
    
    const sourcePath = e.dataTransfer.getData("text/plain");
    const itemName = e.dataTransfer.getData("item-name");
    
    if (!sourcePath || sourcePath === workspaceRoot) return;
    const parentOfSource = sourcePath.substring(0, sourcePath.lastIndexOf(itemName) - 1);
    if (parentOfSource === workspaceRoot) return;

    const newPath = `${workspaceRoot}/${itemName}`;
    
    try {
      await Rename(sourcePath, newPath);
      onFileRename(sourcePath, newPath);
      await loadRoot(workspaceRoot);
    } catch (error) {
      console.error("Failed to move item to root:", error);
    }
  };

  useEffect(() => {
    if (workspaceRoot) {
      loadRoot(workspaceRoot);
    }
  }, [workspaceRoot, loadRoot]);

  useEffect(() => {
    if (!workspaceRoot) return;

    const unsubscribe = EventsOn('workspace-update', (parentPath: string) => {
      if (parentPath === workspaceRoot) {
        loadRoot(workspaceRoot);
      }
    });

    return () => unsubscribe();
  }, [workspaceRoot, loadRoot]);

  return (
    <div 
      className={`w-full h-full border-r border-[#242424] flex flex-col bg-white text-[#242424] overflow-y-auto font-sans transition-colors relative ${isDragOverRoot ? 'ring-2 ring-inset ring-[#242424]' : ''}`}
      onDragOver={handleDragOverRoot}
      onDragLeave={() => setIsDragOverRoot(false)}
      onDrop={handleDropRoot}
    >
      <div 
        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-[#242424] transition-colors z-30 active:bg-[#242424]"
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart();
        }}
      />
      <div className="h-12 min-h-[48px] max-h-[48px] px-4 border-b border-[#242424] flex justify-between items-center font-bold tracking-tight bg-white sticky top-0 z-20">
        <span className="text-xs uppercase">Workspace</span>
        <div className="flex items-center space-x-2">
          {workspaceRoot && (
            <>
              <button onClick={() => setShowNewInput('file')} title="New File" className="hover:bg-[#242424] hover:text-white p-1 rounded transition-colors">
                <FilePlus size={16} />
              </button>
              <button onClick={() => setShowNewInput('folder')} title="New Folder" className="hover:bg-[#242424] hover:text-white p-1 rounded transition-colors">
                <FolderPlus size={16} />
              </button>
            </>
          )}
          <button onClick={openWorkspace} title="Open Folder" className="hover:bg-[#242424] hover:text-white p-1 rounded transition-colors">
            <FolderOpen size={16} />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto py-2">
        {workspaceRoot ? (
          <div className="mb-2">
            <div className="px-3 py-1 text-[10px] text-gray-400 uppercase font-semibold truncate flex items-center" title={workspaceRoot}>
              <span className="truncate flex-grow">{workspaceRoot.split(/[\\/]/).pop()}</span>
            </div>
            
            {showNewInput && (
              <NewItemInput 
                type={showNewInput} 
                onSubmit={handleCreateNew} 
                onCancel={() => setShowNewInput(null)} 
              />
            )}

            {rootItems && rootItems.length > 0 ? (
              rootItems.map((item) => (
                <FileTreeItem 
                  key={item.path} 
                  item={item} 
                  onFileSelect={onFileSelect} 
                  onFileRename={onFileRename}
                  onFileDelete={onFileDelete}
                  showConfirm={showConfirm}
                />
              ))
            ) : (
              <div className="p-4 text-xs text-center text-gray-500 italic">
                Empty folder
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-xs text-center text-gray-500">
            <p className="mb-2">No workspace selected</p>
            <button 
              onClick={openWorkspace}
              className="px-3 py-1 border border-[#242424] text-[10px] uppercase font-bold hover:bg-[#242424] hover:text-white transition-all flex items-center justify-center mx-auto"
            >
              <FolderOpen size={14} className="mr-2" />
              Open Folder
            </button>
          </div>
        )}
      </div>

      <div className="h-12 border-t border-[#242424] flex items-center px-4 bg-white sticky bottom-0 z-20">
        <button 
          onClick={onOpenSettings}
          className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest hover:bg-[#242424] hover:text-white p-2 rounded transition-all w-full"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
