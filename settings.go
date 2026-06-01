package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Settings struct {
	AutoSave     bool `json:"autoSave"`
	SyncScroll   bool `json:"syncScroll"`
	DiscordRPC   bool `json:"discordRPC"`
	SidebarWidth int  `json:"sidebarWidth"`
}

const settingsFileName = "archivum-settings.json"

func getGlobalSettingsPath() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	exeDir := filepath.Dir(exePath)
	return filepath.Join(exeDir, settingsFileName), nil
}

func getWorkspaceSettingsPath(workspacePath string) string {
	if workspacePath == "" {
		return ""
	}
	return filepath.Join(workspacePath, settingsFileName)
}

func loadSettingsFromFile(path string) (*Settings, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var settings Settings
	err = json.Unmarshal(data, &settings)
	if err != nil {
		return nil, err
	}

	return &settings, nil
}

func (a *App) GetSettings(workspacePath string) Settings {
	// Default settings
	finalSettings := Settings{
		AutoSave:     false,
		SyncScroll:   true,
		DiscordRPC:   true,
		SidebarWidth: 256,
	}

	// 1. Try to load global settings
	globalPath, err := getGlobalSettingsPath()
	if err == nil {
		globalSettings, err := loadSettingsFromFile(globalPath)
		if err == nil {
			finalSettings = *globalSettings
		}
	}

	// 2. Try to load workspace settings if workspacePath is provided
	// "if the open workspace folder has a setting file it will replace the "global settings" to the specific workspace settings"
	if workspacePath != "" {
		workspacePathFile := getWorkspaceSettingsPath(workspacePath)
		workspaceSettings, err := loadSettingsFromFile(workspacePathFile)
		if err == nil {
			// Replace global settings with workspace settings
			finalSettings = *workspaceSettings
		}
	}

	return finalSettings
}

func (a *App) SaveSettings(settings Settings, workspacePath string) error {
	var path string
	var err error

	// Default to global path
	path, err = getGlobalSettingsPath()
	if err != nil {
		return err
	}

	// Only save to workspace if the settings file ALREADY exists there
	if workspacePath != "" {
		wsPath := getWorkspaceSettingsPath(workspacePath)
		if _, err := os.Stat(wsPath); err == nil {
			path = wsPath
		}
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
