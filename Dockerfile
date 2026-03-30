# ═══════════════════════════════════════════════════════════════════
#  JetFlux — Multi-stage Docker Build
#  Stage 1 : Build Angular SPA  (Node 20)
#  Stage 2 : Publish .NET 9 API (SDK)
#  Stage 3 : Runtime image      (ASP.NET runtime only — smallest)
# ═══════════════════════════════════════════════════════════════════

# ── Stage 1: Build Angular SPA ──────────────────────────────────────
FROM node:20-alpine AS angular-build

WORKDIR /app/frontend

# Install dependencies first (layer cache)
COPY frontend/package*.json ./
RUN npm ci --silent

# Copy source and build for production
COPY frontend/ .
# angular.json outputPath is "../src/EmptyLegs.API/wwwroot" relative to /app/frontend
# → output lands at /app/src/EmptyLegs.API/wwwroot/browser/
RUN npm run build -- --configuration production


# ── Stage 2: Publish .NET API ────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS dotnet-build

WORKDIR /build

# Copy .NET source
COPY src/ src/

# Copy seed-data (csproj references ../../seed-data relative to src/EmptyLegs.API/)
COPY seed-data/ seed-data/

# Inject the pre-built Angular SPA into the API's wwwroot
COPY --from=angular-build /app/src/EmptyLegs.API/wwwroot src/EmptyLegs.API/wwwroot

# Restore & publish (framework-dependent — runtime image supplies .NET)
RUN dotnet publish src/EmptyLegs.API/EmptyLegs.API.csproj \
    -c Release \
    --no-self-contained \
    -o /app/publish


# ── Stage 3: Runtime ─────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime

WORKDIR /app

# Copy published output (includes wwwroot/browser + seed-data via CopyToPublishDirectory)
COPY --from=dotnet-build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

# Render/Railway/Fly.io inject PORT at runtime; fall back to 8080
EXPOSE 8080
CMD ["sh", "-c", "dotnet JetFlux.dll"]
