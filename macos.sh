#!/bin/bash
#
# macos.sh — apply macOS system preferences as code.
#
# Scripts the settings documented in README.md so a fresh Mac configures
# itself instead of being clicked through System Settings.
# Safe to re-run: every command is idempotent. Nothing here is destructive —
# it only writes preference keys and restarts the affected UI agents.
#
#   ./macos.sh            apply everything
#
# A few settings can't be scripted reliably (Night Shift, Karabiner key swaps);
# those are printed as a short manual checklist at the end.

set -eu

log() { printf '\033[0;36m▸\033[0m %s\n' "$1"; }

# Close System Settings so it can't overwrite changes we're about to make.
osascript -e 'tell application "System Settings" to quit' 2>/dev/null || true

dock() {
    log "Dock — auto-hide, instant, smallest size"
    defaults write com.apple.dock autohide -bool true
    defaults write com.apple.dock autohide-delay -float 0      # show instantly on hover
    defaults write com.apple.dock autohide-time-modifier -float 0.15
    defaults write com.apple.dock tilesize -int 16             # smallest setting
    defaults write com.apple.dock show-recents -bool false
}

menubar() {
    log "Menu bar — auto-hide in full screen only"
    defaults write NSGlobalDomain _HIHideMenuBar -bool false
    defaults write NSGlobalDomain AppleMenuBarVisibleInFullscreen -bool false
}

finder() {
    log "Finder — path/status bar, list view, folders on top, show hidden"
    defaults write com.apple.finder ShowPathbar -bool true
    defaults write com.apple.finder ShowStatusBar -bool true
    defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv"   # list view
    defaults write com.apple.finder _FXSortFoldersFirst -bool true
    defaults write com.apple.finder AppleShowAllFiles -bool true          # ⌘⇧. by default
    defaults write com.apple.finder NewWindowTarget -string "PfHm"        # new windows → Home
    defaults write com.apple.finder NewWindowTargetPath -string "file://${HOME}/"
    defaults write NSGlobalDomain AppleShowAllExtensions -bool true
    defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"   # search current folder
}

input() {
    log "Trackpad & keyboard — natural scroll off, tap to click, fast repeat"
    # Natural scrolling OFF (README: Trackpad/Mouse → off)
    defaults write NSGlobalDomain com.apple.swipescrolldirection -bool false
    # Tap to click
    defaults write com.apple.driver.AppleBluetoothMultitouch.trackpad Clicking -bool true
    defaults write com.apple.AppleMultitouchTrackpad Clicking -bool true
    defaults -currentHost write NSGlobalDomain com.apple.mouse.tapBehavior -int 1
    # Fast key repeat + no press-and-hold accent menu (essential for vim)
    defaults write NSGlobalDomain KeyRepeat -int 2
    defaults write NSGlobalDomain InitialKeyRepeat -int 15
    defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false
    # Caps Lock → Control. Applies immediately; see manual note for persistence.
    hidutil property --set \
      '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x700000039,"HIDKeyboardModifierMappingDst":0x7000000E0}]}' \
      >/dev/null 2>&1 || log "  (hidutil caps→ctrl remap skipped)"
}

screenshots() {
    log "Screenshots — PNG, saved to ~/Desktop (matches the 'scrot' alias)"
    defaults write com.apple.screencapture location -string "${HOME}/Desktop"
    defaults write com.apple.screencapture type -string "png"
    defaults write com.apple.screencapture disable-shadow -bool true
}

network() {
    # Google DNS (README: Network → DNS → 8.8.8.8 / 8.8.4.4). Needs admin.
    if networksetup -listallnetworkservices 2>/dev/null | grep -qx "Wi-Fi"; then
        log "Network — Google DNS on Wi-Fi (may prompt for your password)"
        sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4 || \
            log "  (DNS change skipped)"
    fi
}

restart_agents() {
    log "Restarting Dock, Finder & menu bar to apply changes"
    for app in Dock Finder SystemUIServer; do
        killall "$app" >/dev/null 2>&1 || true
    done
}

manual_checklist() {
    cat <<'EOF'

──────────────────────────────────────────────────────────────
A few things macOS won't let a script set — do these by hand:

  • Displays → Night Shift…  →  schedule "Sunset to Sunrise"
  • Karabiner-Elements  →  swap backslash ⇄ delete (see apple/general/keyboard/)
                            and hide its menu-bar icon
  • Caps Lock → Control is active now via hidutil, but resets on reboot.
    For a permanent remap, set it in System Settings → Keyboard →
    Keyboard Shortcuts… → Modifier Keys (macOS persists that one).
──────────────────────────────────────────────────────────────
EOF
}

main() {
    log "Applying macOS preferences…"
    dock
    menubar
    finder
    input
    screenshots
    network
    restart_agents
    manual_checklist
    log "Done. Some changes need a logout/restart to fully take effect."
}

main
