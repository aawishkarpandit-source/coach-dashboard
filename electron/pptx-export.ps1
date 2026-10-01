# Converts a .ppt/.pptx into one PNG per slide using the locally installed
# Microsoft PowerPoint (COM automation — no internet needed).
# Called by Electron main via: powershell -NoProfile -ExecutionPolicy Bypass
#   -File pptx-export.ps1 -Pptx <file> -OutDir <dir> [-Width 1920] [-Height 1080]
# Output: "OK:<slideCount>" on stdout. "NOPOWERPOINT" + exit 2 if missing.
param(
  [Parameter(Mandatory = $true)][string]$Pptx,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [int]$Width = 1920,
  [int]$Height = 1080
)
$ErrorActionPreference = 'Stop'
try {
  $pp = New-Object -ComObject PowerPoint.Application
} catch {
  Write-Output 'NOPOWERPOINT'
  exit 2
}
try {
  $pp.Visible = $false
  $pres = $pp.Presentations.Open($Pptx, $true, $false, $false)
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
  $i = 0
  foreach ($s in $pres.Slides) {
    $i++
    $name = 'slide-{0:D3}.png' -f $i
    $s.Export((Join-Path $OutDir $name), 'PNG', $Width, $Height) | Out-Null
  }
  $count = $pres.Slides.Count
  $pres.Close()
  Write-Output ("OK:{0}" -f $count)
  exit 0
} catch {
  Write-Output ("FAILED:{0}" -f $_.Exception.Message)
  exit 1
} finally {
  try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null } catch {}
  try { $pp.Quit() } catch {}
  try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) | Out-Null } catch {}
}
