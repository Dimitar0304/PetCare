# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files first so NuGet restore is cached independently of source changes
COPY Petcare.sln ./
COPY Petcare/Petcare.csproj                       Petcare/
COPY PetCare.Core/PetCare.Core.csproj             PetCare.Core/
COPY PetCare.Infrastructure/PetCare.Infrastructure.csproj PetCare.Infrastructure/

RUN dotnet restore Petcare.sln

# Copy the rest of the source and publish
COPY . .
RUN dotnet publish Petcare/Petcare.csproj -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# ASP.NET Core listens on HTTP only inside the container (nginx or host handles TLS).
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 80
ENTRYPOINT ["dotnet", "Petcare.dll"]
