package main

import (
	"bytes"
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/fsnotify/fsnotify"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

// App struct
type App struct {
	ctx         context.Context
	watcher     *fsnotify.Watcher
	initialFile string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// InitialFile represents the file passed via command line
type InitialFile struct {
	Path   string `json:"path"`
	Parent string `json:"parent"`
}

// GetInitialFile returns the file path passed via command line
func (a *App) GetInitialFile() *InitialFile {
	if a.initialFile == "" {
		return nil
	}
	return &InitialFile{
		Path:   a.initialFile,
		Parent: filepath.Dir(a.initialFile),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// startWatching begins monitoring a directory recursively
func (a *App) startWatching(path string) {
	if a.watcher != nil {
		a.watcher.Close()
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		fmt.Printf("Failed to create watcher: %v\n", err)
		return
	}
	a.watcher = watcher

	// Add all subdirectories to the watcher
	filepath.WalkDir(path, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			err = a.watcher.Add(p)
			if err != nil {
				fmt.Printf("Failed to add %s to watcher: %v\n", p, err)
			}
		}
		return nil
	})

	go func() {
		for {
			select {
			case event, ok := <-a.watcher.Events:
				if !ok {
					return
				}
				// Handle structural changes
				if event.Op&(fsnotify.Create|fsnotify.Remove|fsnotify.Rename) != 0 {
					// If a new directory is created, watch it
					if event.Op&fsnotify.Create != 0 {
						info, err := os.Stat(event.Name)
						if err == nil && info.IsDir() {
							a.watcher.Add(event.Name)
						}
					}
					// Notify frontend with the parent directory of the change
					parent := filepath.Dir(event.Name)
					runtime.EventsEmit(a.ctx, "workspace-update", parent)
				}
			case err, ok := <-a.watcher.Errors:
				if !ok {
					return
				}
				fmt.Printf("Watcher error: %v\n", err)
			}
		}
	}()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// FileNode represents a file or directory in the file system
type FileNode struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	IsDir bool   `json:"isDir"`
}

// OpenWorkspaceDialog opens a directory dialog and returns the selected path
func (a *App) OpenWorkspaceDialog() (string, error) {
	result, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Workspace Folder",
	})
	if err != nil {
		return "", err
	}
	if result != "" {
		a.startWatching(result)
	}
	return result, nil
}

// GetDirectoryLevel returns the files and folders within a given directory path
func (a *App) GetDirectoryLevel(path string) ([]FileNode, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var nodes []FileNode
	for _, entry := range entries {
		nodes = append(nodes, FileNode{
			Name:  entry.Name(),
			Path:  filepath.Join(path, entry.Name()),
			IsDir: entry.IsDir(),
		})
	}
	return nodes, nil
}

// CreateFile creates a new empty file at the given path
func (a *App) CreateFile(path string) error {
	return os.WriteFile(path, []byte(""), 0644)
}

// CreateDirectory creates a new directory at the given path
func (a *App) CreateDirectory(path string) error {
	return os.Mkdir(path, 0755)
}

// Delete removes a file or directory at the given path
func (a *App) Delete(path string) error {
	return os.RemoveAll(path)
}

// Rename renames a file or directory
func (a *App) Rename(oldPath string, newPath string) error {
	return os.Rename(oldPath, newPath)
}

// ReadFile reads the content of a file
func (a *App) ReadFile(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// SaveFile saves the content to a file
func (a *App) SaveFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// PrintToPDF generates a PDF from the given markdown content
func (a *App) PrintToPDF(markdown string, filename string) error {
	// Determine default filename
	defaultName := "document.pdf"
	if filename != "" {
		base := filepath.Base(filename)
		ext := filepath.Ext(base)
		defaultName = base[:len(base)-len(ext)] + ".pdf"
	}

	// Get save path from user
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save PDF",
		DefaultFilename: defaultName,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "PDF Files (*.pdf)",
				Pattern:     "*.pdf",
			},
		},
	})
	if err != nil {
		return err
	}
	if path == "" {
		return nil
	}

	// Convert markdown to HTML
	md := goldmark.New(
		goldmark.WithExtensions(extension.GFM),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			html.WithHardWraps(),
			html.WithXHTML(),
		),
	)

	var buf bytes.Buffer
	if err := md.Convert([]byte(markdown), &buf); err != nil {
		return err
	}

	// Create a full HTML document with styling
	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{TITLE}}</title>
    <style>
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #242424;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        h1 {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            border-bottom: 8px solid #242424;
            padding-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: -0.05em;
            line-height: 1;
        }
        h2 {
            font-size: 1.75rem;
            font-weight: 800;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            border-bottom: 4px solid #242424;
            padding-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: -0.02em;
        }
        h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-top: 2rem;
            margin-bottom: 1rem;
            text-transform: uppercase;
        }
        blockquote {
            border-left: 12px solid #242424;
            padding-left: 1.5rem;
            font-style: italic;
            margin: 2rem 0;
            font-size: 1.1rem;
        }
        code {
            background-color: #f0f0f0;
            padding: 0.2rem 0.4rem;
            font-family: monospace;
        }
        pre {
            background-color: #242424;
            color: white;
            padding: 1.5rem;
            margin: 1.5rem 0;
            overflow-x: auto;
        }
        pre code {
            background-color: transparent;
            color: inherit;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
        }
        th, td {
            border: 1px solid #242424;
            padding: 0.75rem;
            text-align: left;
        }
        th {
            background-color: #242424;
            color: white;
        }
        img {
            max-width: 100% !important;
            vertical-align: middle !important;
            display: inline-block !important;
            margin: 2px !important;
        }
        a {
            display: inline-block !important;
            text-decoration: none;
            color: #242424;
        }
        p {
            margin-bottom: 1.25rem;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        {{CONTENT}}
    </div>
</body>
</html>
`
	htmlDoc := strings.Replace(htmlTemplate, "{{CONTENT}}", buf.String(), 1)
	htmlDoc = strings.Replace(htmlDoc, "{{TITLE}}", defaultName, 1)

	// Create a temporary file for the HTML content to ensure remote resources load correctly
	tmpFile, err := os.CreateTemp("", "archivum-*.html")
	if err != nil {
		return err
	}
	tmpFile.Close()
	defer os.Remove(tmpFile.Name())

	if err := os.WriteFile(tmpFile.Name(), []byte(htmlDoc), 0644); err != nil {
		return err
	}

	// Use chromedp to print to PDF
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	var pdfBuffer []byte
	if err := chromedp.Run(ctx,
		chromedp.Navigate("file:///"+filepath.ToSlash(tmpFile.Name())),
		// Wait for all images to load
		chromedp.Evaluate(`
			Promise.all(Array.from(document.images).map(img => {
				if (img.complete) return Promise.resolve();
				return new Promise(resolve => { img.onload = img.onerror = resolve; });
			}))
		`, nil),
		chromedp.ActionFunc(func(ctx context.Context) error {
			buf, _, err := page.PrintToPDF().
				WithPrintBackground(true).
				WithPaperWidth(8.27).   // A4
				WithPaperHeight(11.69). // A4
				WithMarginTop(0.4).
				WithMarginBottom(0.4).
				WithMarginLeft(0.4).
				WithMarginRight(0.4).
				Do(ctx)
			if err != nil {
				return err
			}
			pdfBuffer = buf
			return nil
		}),
	); err != nil {
		return err
	}


	return os.WriteFile(path, pdfBuffer, 0644)
}
