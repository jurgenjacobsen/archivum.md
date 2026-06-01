package main

import (
	"fmt"
	"time"

	"github.com/hugolgst/rich-go/client"
)

var discordClientID = "1511003655141200062" // Replace with actual Client ID if available
var isDiscordActive = false

func (a *App) initDiscord() {
	settings := a.GetSettings("")
	if !settings.DiscordRPC {
		return
	}

	err := client.Login(discordClientID)
	if err != nil {
		fmt.Printf("Failed to connect to Discord: %v\n", err)
		return
	}
	isDiscordActive = true

	// Set initial status
	a.updateDiscordStatus("Idle", "")
}

func (a *App) updateDiscordStatus(details string, state string) {
	if !isDiscordActive {
		// Try to login if not active but enabled in settings
		settings := a.GetSettings("")
		if settings.DiscordRPC {
			err := client.Login(discordClientID)
			if err == nil {
				isDiscordActive = true
			} else {
				return
			}
		} else {
			return
		}
	}

	now := time.Now()
	err := client.SetActivity(client.Activity{
		State:      state,
		Details:    details,
		LargeImage: "logo",
		LargeText:  "Archivum Markdown",
		Timestamps: &client.Timestamps{
			Start: &now,
		},
	})

	if err != nil {
		fmt.Printf("Failed to set Discord activity: %v\n", err)
	}
}

func (a *App) stopDiscord() {
	if isDiscordActive {
		client.Logout()
		isDiscordActive = false
	}
}

// ToggleDiscordRPC enables or disables Discord RPC at runtime
func (a *App) ToggleDiscordRPC(enabled bool) {
	if enabled {
		if !isDiscordActive {
			a.initDiscord()
		}
	} else {
		a.stopDiscord()
	}
}
