param(
  [string]$Destination = (Join-Path $PSScriptRoot '..\assets\cinematic\source_assets')
)

$ErrorActionPreference = 'Stop'

function Save-RemoteFile {
  param([string]$Url, [string]$Path)
  $parent = Split-Path -Parent $Path
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  if (-not (Test-Path -LiteralPath $Path)) {
    Invoke-WebRequest -Uri $Url -OutFile $Path
  }
}

function Save-PolyHavenBlend {
  param([string]$AssetId)
  $assetRoot = Join-Path $Destination ('polyhaven\' + $AssetId)
  $payload = Invoke-RestMethod -Uri ('https://api.polyhaven.com/files/' + $AssetId)
  $bundle = $payload.blend.'1k'.blend
  Save-RemoteFile -Url $bundle.url -Path (Join-Path $assetRoot ($AssetId + '_1k.blend'))
  foreach ($entry in $bundle.include.PSObject.Properties) {
    Save-RemoteFile -Url $entry.Value.url -Path (Join-Path $assetRoot $entry.Name)
  }
}

Save-PolyHavenBlend -AssetId 'industrial_pipe_lamp'
Save-PolyHavenBlend -AssetId 'WoodenTable_01'
Save-PolyHavenBlend -AssetId 'modern_arm_chair_01'

$ambientRoot = Join-Path $Destination 'ambientcg\Marble020'
$ambientZip = Join-Path $ambientRoot 'Marble020_1K-JPG.zip'
Save-RemoteFile -Url 'https://ambientcg.com/get?file=Marble020_1K-JPG.zip' -Path $ambientZip
if (-not (Test-Path -LiteralPath (Join-Path $ambientRoot 'Marble020_1K-JPG_Color.jpg'))) {
  Expand-Archive -LiteralPath $ambientZip -DestinationPath $ambientRoot -Force
}

Write-Host ('Assets downloaded to ' + (Resolve-Path $Destination))
