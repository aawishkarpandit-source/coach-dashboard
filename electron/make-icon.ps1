# Regenerates electron/icon.png + electron/icon.ico
# (classroom green board on white background). Run if you tweak the design:
#   powershell -ExecutionPolicy Bypass -File electron/make-icon.ps1
Add-Type -AssemblyName System.Drawing
$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::White)
# wooden frame
$frame = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(146, 64, 14))
$g.FillRectangle($frame, 24, 40, 208, 148)
# green board
$green = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 101, 52))
$g.FillRectangle($green, 34, 50, 188, 128)
# chalk writing
$font = New-Object System.Drawing.Font('Arial', 72, [System.Drawing.FontStyle]::Bold)
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = 'Center'
$fmt.LineAlignment = 'Center'
$g.DrawString('Aa', $font, $white, (New-Object System.Drawing.RectangleF(34, 50, 188, 128)), $fmt)
# chalk tray + chalk stick + eraser
$tray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 53, 15))
$g.FillRectangle($tray, 24, 188, 208, 16)
$g.FillRectangle($white, 60, 191, 44, 8)
$eraser = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(31, 41, 55))
$g.FillRectangle($eraser, 150, 190, 40, 10)
$png = Join-Path $PSScriptRoot 'icon.png'
$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$h = $bmp.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($h)
$fs = [System.IO.File]::Create((Join-Path $PSScriptRoot 'icon.ico'))
$ico.Save($fs)
$fs.Close()
$g.Dispose()
$bmp.Dispose()
Write-Output "wrote $png"
