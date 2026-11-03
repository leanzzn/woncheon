# 원본 이미지 → 워터마크가 박힌 저해상도 미리보기 (previews/<id>.jpg)
# 사용법: .\make-preview.ps1 "원본.png" tk-ng/front        (폭 기본 480px, 원본이 더 작으면 원본 폭)
param([string]$src, [string]$id, [int]$width = 480)

Add-Type -AssemblyName System.Drawing
$img = [Drawing.Image]::FromFile((Resolve-Path $src))
$width = [Math]::Min($width, $img.Width)
$h = [int]($img.Height * $width / $img.Width)
$bmp = New-Object Drawing.Bitmap $width, $h
$g = [Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = "HighQualityBicubic"
$g.DrawImage($img, 0, 0, $width, $h)

# 대각선으로 반복되는 woncheon 워터마크 (이미지 폭에 맞춰 크기 조절)
$k = [Math]::Max(0.4, $width / 480)
$font = New-Object Drawing.Font "Segoe UI", ([float](14 * $k)), ([Drawing.FontStyle]::Bold), ([Drawing.GraphicsUnit]::Pixel)
$brush = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(70, 17, 19, 24))
$g.RotateTransform(-24)
for ($y = -$h; $y -lt $h * 2; $y += 90 * $k) {
  for ($x = -$width; $x -lt $width * 2; $x += 150 * $k) { $g.DrawString("woncheon", $font, $brush, $x, $y) }
}

$out = Join-Path "$PWD\previews" "$id.jpg"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
$jpeg = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
$q = New-Object Drawing.Imaging.EncoderParameters 1
$q.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 80L
$bmp.Save($out, $jpeg, $q)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
"previews\$id.jpg ($width x $h)"
