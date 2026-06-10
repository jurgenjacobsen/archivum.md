package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"

	"github.com/blang/semver"
)

//go:embed wails.json
var wailsConfig []byte

const (
	owner = "jurgenjacobsen"
	repo  = "archivum.md"
)

func getAppVersion() string {
	var config struct {
		Version string `json:"version"`
	}
	if err := json.Unmarshal(wailsConfig, &config); err != nil {
		return "0.0.0"
	}
	return config.Version
}

type Release struct {
	TagName string `json:"tag_name"`
	Assets  []Asset `json:"assets"`
}

type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type UpdateInfo struct {
	Available   bool   `json:"available"`
	LatestVersion string `json:"latestVersion"`
	DownloadURL  string `json:"downloadUrl"`
}

func (a *App) CheckForUpdates() (UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)
	
	resp, err := http.Get(url)
	if err != nil {
		return UpdateInfo{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return UpdateInfo{}, fmt.Errorf("failed to check for updates: %s", resp.Status)
	}

	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return UpdateInfo{}, err
	}

	currentVersion := getAppVersion()
	currentV, err := semver.Parse(strings.TrimPrefix(currentVersion, "v"))
	if err != nil {
		return UpdateInfo{}, err
	}

	latestV, err := semver.Parse(strings.TrimPrefix(release.TagName, "v"))
	if err != nil {
		return UpdateInfo{}, err
	}

	if latestV.GT(currentV) {
		downloadURL := ""
		suffix := ""
		
		switch runtime.GOOS {
		case "windows":
			suffix = ".exe"
		case "darwin":
			suffix = ".dmg"
		case "linux":
			suffix = ".deb" // Or .AppImage
		}

		for _, asset := range release.Assets {
			if strings.HasSuffix(asset.Name, suffix) {
				downloadURL = asset.BrowserDownloadURL
				break
			}
		}

		// Fallback to first asset if no exact match
		if downloadURL == "" && len(release.Assets) > 0 {
			downloadURL = release.Assets[0].BrowserDownloadURL
		}

		return UpdateInfo{
			Available:     true,
			LatestVersion: release.TagName,
			DownloadURL:   downloadURL,
		}, nil
	}

	return UpdateInfo{Available: false}, nil
}
