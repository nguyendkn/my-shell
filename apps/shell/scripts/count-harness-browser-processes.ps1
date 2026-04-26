$ErrorActionPreference = "Stop"

$filter = "Name = 'chrome.exe' OR Name = 'msedge.exe' OR Name = 'msedgewebview2.exe'"
$processes = Get-CimInstance -ClassName Win32_Process -Filter $filter
$harnessProcesses = $processes | Where-Object {
  $_.CommandLine -like "*--fptclaw-browser-title=*"
}

($harnessProcesses | Measure-Object).Count
