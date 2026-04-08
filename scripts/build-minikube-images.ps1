param(
  [string] $Tag = 'local',
  [switch] $MinikubeNative
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$onWindows = $env:OS -eq 'Windows_NT'

function Invoke-DockerBuildToMinikube {
  param(
    [Parameter(Mandatory = $true)][string] $ServiceName,
    [Parameter(Mandatory = $true)][string] $ContextRelative
  )
  $image = "delivery-system/${ServiceName}:${Tag}"
  $ctxAbs = (Resolve-Path (Join-Path $RepoRoot $ContextRelative)).Path
  $dfAbs = Join-Path $ctxAbs 'Dockerfile'
  Write-Host "docker build -> $image"
  & docker build -t $image -f $dfAbs $ctxAbs
  if ($LASTEXITCODE -ne 0) {
    throw "docker build failed: $ServiceName (exit $LASTEXITCODE)"
  }
}

function Invoke-MinikubeCliBuild {
  param(
    [Parameter(Mandatory = $true)][string] $ServiceName,
    [Parameter(Mandatory = $true)][string] $ContextRelative
  )
  $ctx = ($ContextRelative -replace '\\', '/').Trim('/')
  $dockerfile = "${ctx}/Dockerfile"
  $image = "delivery-system/${ServiceName}:${Tag}"
  Write-Host "minikube image build -> $image"
  & minikube image build -t $image -f $dockerfile $ctx
  if ($LASTEXITCODE -ne 0) {
    throw "minikube image build failed: $ServiceName (exit $LASTEXITCODE)"
  }
}

$services = @(
  @{ Name = 'catalog-service'; Context = 'apps/catalog-service' },
  @{ Name = 'fleet-service'; Context = 'apps/fleet-service' },
  @{ Name = 'order-service'; Context = 'apps/order-service' },
  @{ Name = 'api-gateway'; Context = 'apps/api-gateway' }
)

$useMinikubeCli = $MinikubeNative -or -not $onWindows

if (-not $useMinikubeCli) {
  Write-Host 'Using Docker daemon inside Minikube (recommended on Windows).'
  minikube docker-env | Invoke-Expression
  try {
    foreach ($s in $services) {
      Invoke-DockerBuildToMinikube -ServiceName $s.Name -ContextRelative $s.Context
    }
  }
  finally {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    minikube docker-env -u | ForEach-Object { Invoke-Expression $_ }
    $ErrorActionPreference = $prevEap
  }
}
else {
  foreach ($s in $services) {
    Invoke-MinikubeCliBuild -ServiceName $s.Name -ContextRelative $s.Context
  }
}
