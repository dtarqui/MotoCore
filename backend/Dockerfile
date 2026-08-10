# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/MotoCore.Domain/MotoCore.Domain.csproj src/MotoCore.Domain/
COPY src/MotoCore.Application/MotoCore.Application.csproj src/MotoCore.Application/
COPY src/MotoCore.Infrastructure/MotoCore.Infrastructure.csproj src/MotoCore.Infrastructure/
COPY src/MotoCore.Api/MotoCore.Api.csproj src/MotoCore.Api/
RUN dotnet restore src/MotoCore.Api/MotoCore.Api.csproj

COPY src/ src/
RUN dotnet publish src/MotoCore.Api/MotoCore.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "MotoCore.Api.dll"]
