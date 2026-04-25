SHELL := pwsh.exe
.SHELLFLAGS := -NoLogo -NoProfile -ExecutionPolicy Bypass -Command

SHELL_DEV_DIR := $(CURDIR)/apps/shell/build/dev-win-x64

.PHONY: help stop stop-dev dev

help:
	@Write-Host "Targets:"
	@Write-Host "  make stop      Stop stale FPTClaw desktop dev processes"
	@Write-Host "  make stop-dev  Same as stop"
	@Write-Host "  make dev       Stop stale processes, then run bun run dev"

stop: stop-dev

stop-dev:
	@$$devDir = [System.IO.Path]::GetFullPath('$(SHELL_DEV_DIR)'); $$processes = Get-CimInstance Win32_Process | Where-Object { $$_.ExecutablePath -and [System.IO.Path]::GetFullPath($$_.ExecutablePath).StartsWith($$devDir, [System.StringComparison]::OrdinalIgnoreCase) }; if (-not $$processes) { Write-Host "No stale FPTClaw desktop dev processes found."; exit 0 }; $$processes | ForEach-Object { Write-Host ("Stopping PID {0}: {1}" -f $$_.ProcessId, $$_.ExecutablePath); Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }; Start-Sleep -Milliseconds 300

dev: stop-dev
	@bun run dev
