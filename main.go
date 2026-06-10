package main

import (
	"embed"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Check for command line arguments
	if len(os.Args) > 1 {
		// The first argument (index 1) is usually the file path when using "Open with"
		// We use filepath.Abs to ensure we have a full path
		path := os.Args[1]
		if absPath, err := filepath.Abs(path); err == nil {
			// Check if file exists and is not a directory
			if info, err := os.Stat(absPath); err == nil && !info.IsDir() {
				app.initialFile = absPath
			}
		}
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Archivum.md",
        
		MinWidth:  1024,
		MinHeight: 768,
		WindowStartState:   options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
