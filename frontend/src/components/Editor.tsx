import { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrowserOpenURL } from "../../wailsjs/runtime/runtime";

interface EditorProps {
  content: string;
  setContent: (content: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  previewRef: React.RefObject<HTMLDivElement>;
  syncScroll: boolean;
  onEditorContextMenu?: (e: React.MouseEvent) => void;
  onPreviewContextMenu?: (e: React.MouseEvent) => void;
}

export const Editor = ({ 
  content, 
  setContent, 
  textareaRef, 
  previewRef, 
  syncScroll,
  onEditorContextMenu,
  onPreviewContextMenu
}: EditorProps) => {
  const [localContent, setLocalContent] = useState(content);
  const activeSource = useRef<HTMLElement | null>(null);

  // Sync local content when parent content changes (e.g. file loaded or formatting applied)
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Debounce parent state update (prose rendering and autosave)
  useEffect(() => {
    if (localContent === content) return;

    const timer = setTimeout(() => {
      setContent(localContent);
    }, 150); // 150ms debounce for smooth typing

    return () => clearTimeout(timer);
  }, [localContent, content, setContent]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (!syncScroll || activeSource.current !== e.currentTarget) return;
    
    const source = e.currentTarget;
    const target = source === textareaRef.current ? previewRef.current : textareaRef.current;
    
    if (target) {
      const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    activeSource.current = e.currentTarget;
  };

  return (
    <div className="flex-grow flex overflow-hidden bg-white">
      {/* Edit Pane */}
      <div 
        className="w-1/2 h-full border-r border-[#242424] flex flex-col no-print"
        onContextMenu={(e) => {
          if (onEditorContextMenu) {
            e.preventDefault();
            onEditorContextMenu(e);
          }
        }}
      >
        <div className="bg-[#242424] text-white text-[10px] uppercase font-bold px-4 py-1 tracking-widest flex-shrink-0">Editor</div>
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          className="flex-grow p-8 outline-none resize-none font-mono text-sm text-[#242424] leading-relaxed selection:bg-[#242424] selection:text-white"
          placeholder="Enter markdown..."
          spellCheck={false}
        />
      </div>

      {/* Preview Pane */}
      <div 
        className="w-1/2 h-full flex flex-col overflow-hidden print:w-full print:h-auto print:overflow-visible"
        onContextMenu={(e) => {
          if (onPreviewContextMenu) {
            e.preventDefault();
            onPreviewContextMenu(e);
          }
        }}
      >
        <div className="bg-white text-[#242424] text-[10px] uppercase font-bold px-4 py-1 border-b border-[#242424] tracking-widest flex-shrink-0 no-print">Preview</div>
        <div 
          ref={previewRef}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          className="flex-grow overflow-auto p-8 prose-sm print:p-0 print:overflow-visible"
        >
          <div className="markdown-body text-[#242424]">
            {content ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a({ href, children }) {
                    return (
                      <a 
                        href={href} 
                        onClick={(e) => {
                          e.preventDefault();
                          if (href) BrowserOpenURL(href);
                        }}
                        className="cursor-pointer underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  code({ node, inline, className, children, ...props }: any) {
                    const contentStr = String(children);
                    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;

                    if (inline && (hexRegex.test(contentStr) || rgbRegex.test(contentStr))) {
                      return (
                        <span className="inline-flex items-center">
                          <span 
                            className="inline-block w-3 h-3 border border-[#242424] mr-1 shadow-sm" 
                            style={{ backgroundColor: contentStr }}
                          />
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </span>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  p({ children }) {
                    const processColors = (nodes: any[]): any[] => {
                      const combinedRegex = /(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}))|(rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))/g;

                      return nodes.flatMap((node) => {
                        if (typeof node !== 'string') return node;

                        const parts: any[] = [];
                        let lastIndex = 0;
                        let match;

                        while ((match = combinedRegex.exec(node)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(node.substring(lastIndex, match.index));
                          }

                          const color = match[0];
                          parts.push(
                            <span key={match.index} className="inline-flex items-center font-mono text-[0.9em] bg-gray-100 px-1 rounded">
                              <span 
                                className="inline-block w-3 h-3 border border-[#242424]/25 mr-1" 
                                style={{ backgroundColor: color }}
                              />
                              {color}
                            </span>
                          );
                          lastIndex = combinedRegex.lastIndex;
                        }

                        if (lastIndex < node.length) {
                          parts.push(node.substring(lastIndex));
                        }

                        return parts;
                      });
                    };

                    return <p>{processColors(Array.isArray(children) ? children : [children])}</p>;
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="text-gray-300 italic">Nothing to preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
