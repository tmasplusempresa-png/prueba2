#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script para desplegar Supabase Edge Functions automáticamente

.DESCRIPTION
    Este script:
    1. Valida que estés en la carpeta correcta
    2. Login a Supabase (si no estás logueado)
    3. Despliega las Edge Functions
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING SUPABASE EDGE FUNCTIONS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$PROJECT_ID = "utofhxgzkdhljrixperh"
$CURRENT_DIR = Get-Location

Write-Host "📁 Current directory: $CURRENT_DIR" -ForegroundColor Yellow

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "supabase/functions")) {
    Write-Host "❌ Error: supabase/functions directory not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you run this script from the project root:" -ForegroundColor White
    Write-Host "  cd 'c:\Users\andre\Desktop\Proyecto 2026\Completion_2.0'" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Found supabase/functions directory" -ForegroundColor Green
Write-Host ""

# STEP 1: Login
Write-Host "📝 STEP 1: Login to Supabase" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running: npx supabase login" -ForegroundColor Gray
npx supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Login failed or was cancelled. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# STEP 2: Deploy
Write-Host "🚀 STEP 2: Deploy Edge Functions" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deploying to project: $PROJECT_ID" -ForegroundColor Gray
Write-Host ""

Write-Host "Running: npx supabase functions deploy --project-ref=$PROJECT_ID" -ForegroundColor Gray
npx supabase functions deploy --project-ref=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 3: Verify
Write-Host "📋 Verifying deployed functions..." -ForegroundColor Yellow
npx supabase functions list --project-ref=$PROJECT_ID

Write-Host ""
Write-Host "✨ Done! Edge Functions are now live at:" -ForegroundColor Green
Write-Host ""
Write-Host "  📞 generateAgoraToken:" -ForegroundColor White
Write-Host "     https://$PROJECT_ID.supabase.co/functions/v1/generateAgoraToken" -ForegroundColor Gray
Write-Host ""
Write-Host "  🔔 notifyIncomingCall:" -ForegroundColor White
Write-Host "     https://$PROJECT_ID.supabase.co/functions/v1/notifyIncomingCall" -ForegroundColor Gray
Write-Host ""
