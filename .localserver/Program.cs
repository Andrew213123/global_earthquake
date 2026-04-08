using LocalQuakeServer;
using Microsoft.Extensions.FileProviders;

static double NormalizeProjectMinMagnitude(double? value) =>
    Math.Max(EarthquakeStore.ProjectMinMagnitude, value ?? EarthquakeStore.ProjectMinMagnitude);

if (args.Any(static arg => string.Equals(arg, "--export-static-catalog", StringComparison.OrdinalIgnoreCase)))
{
    var batchSizeArg = args
        .FirstOrDefault(static arg => arg.StartsWith("--batch-size=", StringComparison.OrdinalIgnoreCase));
    var batchSize = 10_000;
    if (batchSizeArg is not null
        && int.TryParse(batchSizeArg.Split('=', 2)[1], out var parsedBatchSize))
    {
        batchSize = Math.Clamp(parsedBatchSize, 1_000, 20_000);
    }

    var outputArg = args
        .FirstOrDefault(static arg => arg.StartsWith("--output=", StringComparison.OrdinalIgnoreCase));
    var outputPath = outputArg is null
        ? Path.Combine(Directory.GetCurrentDirectory(), "data", "catalog")
        : Path.GetFullPath(outputArg.Split('=', 2)[1], Directory.GetCurrentDirectory());

    var store = new EarthquakeStore();
    await store.InitializeAsync();
    try
    {
        var exportSummary = await StaticCatalogExporter.ExportAsync(
            store,
            outputPath,
            batchSize,
            CancellationToken.None);
        Console.WriteLine(
            $"Exported static catalog to {exportSummary.OutputPath} ({exportSummary.BatchCount} batches, {exportSummary.TotalCount} events).");
    }
    finally
    {
        await store.DisposeAsync();
    }

    return;
}

var builder = WebApplication.CreateBuilder(args);
var serverUrl = Environment.GetEnvironmentVariable("QUAKE_SERVER_URL") ?? "http://127.0.0.1:8123";
builder.WebHost.UseUrls(serverUrl);
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(options =>
{
    options.SingleLine = true;
    options.TimestampFormat = "HH:mm:ss ";
});

builder.Services.AddSingleton<EarthquakeStore>();
builder.Services.AddHttpClient<UsgsSyncService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("QuakePrototype/1.0");
});
builder.Services.AddSingleton<CatalogSyncCoordinator>();

var app = builder.Build();
var root = Directory.GetCurrentDirectory();
var earthquakeStore = app.Services.GetRequiredService<EarthquakeStore>();
var catalogSyncCoordinator = app.Services.GetRequiredService<CatalogSyncCoordinator>();
await earthquakeStore.InitializeAsync();
await catalogSyncCoordinator.EnsureFullCatalogSyncScheduledAsync();

app.MapGet("/health", async (EarthquakeStore store, CatalogSyncCoordinator syncCoordinator, CancellationToken cancellationToken) =>
    Results.Ok(new
    {
        ok = true,
        storage = "sqlite",
        projectMinMagnitude = EarthquakeStore.ProjectMinMagnitude,
        storedCount = await store.GetStoredCountAsync(cancellationToken),
        databasePath = store.DatabasePath,
        catalogSync = await syncCoordinator.GetStatusAsync(cancellationToken)
    }));

app.MapGet("/api/storage/status", async (EarthquakeStore store, CatalogSyncCoordinator syncCoordinator, CancellationToken cancellationToken) =>
    Results.Ok(new
    {
        storage = "sqlite",
        projectMinMagnitude = EarthquakeStore.ProjectMinMagnitude,
        storedCount = await store.GetStoredCountAsync(cancellationToken),
        databasePath = store.DatabasePath,
        catalogSync = await syncCoordinator.GetStatusAsync(cancellationToken)
    }));

app.MapGet(
    "/api/storage/catalog-sync",
    async (CatalogSyncCoordinator syncCoordinator, CancellationToken cancellationToken) =>
        Results.Ok(await syncCoordinator.GetStatusAsync(cancellationToken)));

app.MapPost(
    "/api/storage/catalog-sync",
    async (bool? force, CatalogSyncCoordinator syncCoordinator, CancellationToken cancellationToken) =>
        Results.Accepted(
            "/api/storage/catalog-sync",
            await syncCoordinator.EnsureFullCatalogSyncScheduledAsync(force ?? false, cancellationToken)));

app.MapGet(
    "/api/storage/sync",
    async (
        DateTimeOffset? start,
        DateTimeOffset? end,
        double? minMagnitude,
        UsgsSyncService syncService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var rangeStart = start ?? new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var rangeEnd = end ?? DateTimeOffset.UtcNow;
            var threshold = NormalizeProjectMinMagnitude(minMagnitude);
            var summary = await syncService.SyncAsync(
                rangeStart,
                rangeEnd,
                threshold,
                isFullSync: rangeStart <= new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero),
                isIncremental: rangeStart > new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero),
                cancellationToken: cancellationToken);
            return Results.Ok(summary);
        }
        catch (Exception exception)
        {
            return Results.Problem(
                title: "SQLite sync failed",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
    });

app.MapPost(
    "/api/storage/sync",
    async (
        SyncRequest request,
        UsgsSyncService syncService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var rangeStart = request.Start ?? new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var rangeEnd = request.End ?? DateTimeOffset.UtcNow;
            var threshold = NormalizeProjectMinMagnitude(request.MinMagnitude);
            var summary = await syncService.SyncAsync(
                rangeStart,
                rangeEnd,
                threshold,
                isFullSync: rangeStart <= new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero),
                isIncremental: rangeStart > new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero),
                cancellationToken: cancellationToken);
            return Results.Ok(summary);
        }
        catch (Exception exception)
        {
            return Results.Problem(
                title: "SQLite sync failed",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
    });

app.MapPost(
    "/api/storage/ingest",
    async (
        IngestRequest request,
        EarthquakeStore store,
        CancellationToken cancellationToken) =>
    {
        var syncedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var records = (request.Events ?? [])
            .Select(item =>
            {
                if (item is null ||
                    string.IsNullOrWhiteSpace(item.Id) ||
                    item.Lon is null ||
                    item.Lat is null ||
                    item.Depth is null ||
                    item.Mag is null ||
                    item.Time is null)
                {
                    return null;
                }

                return new EarthquakeRecord(
                    item.Id.Trim(),
                    item.Lon.Value,
                    item.Lat.Value,
                    Math.Max(0, item.Depth.Value),
                    item.Mag.Value,
                    item.Time.Value,
                    item.Updated ?? item.Time.Value,
                    string.IsNullOrWhiteSpace(item.Place) ? "未标注位置" : item.Place.Trim(),
                    item.Url?.Trim() ?? string.Empty,
                    item.Alert?.Trim() ?? string.Empty,
                    item.Tsunami ?? 0,
                    item.Significance ?? 0,
                    syncedAt);
            })
            .OfType<EarthquakeRecord>()
            .ToArray();

        var upsertResult = await store.UpsertBatchAsync(records, cancellationToken);
        var storedCount = await store.GetStoredCountAsync(cancellationToken);

        return Results.Ok(new
        {
            fetchedCount = upsertResult.FetchedCount,
            insertedCount = upsertResult.InsertedCount,
            updatedCount = upsertResult.UpdatedCount,
            skippedCount = upsertResult.SkippedCount,
            storedCount,
            storage = "sqlite",
            source = "frontend-live-supplement"
        });
    });

app.MapGet(
    "/api/earthquakes",
    async (
        DateTimeOffset? start,
        DateTimeOffset? end,
        double? minMagnitude,
        int? limit,
        int? offset,
        EarthquakeStore store,
        CancellationToken cancellationToken) =>
    {
        var rangeStart = (start ?? new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero))
            .ToUnixTimeMilliseconds();
        var rangeEnd = (end ?? DateTimeOffset.UtcNow).ToUnixTimeMilliseconds();
        var threshold = NormalizeProjectMinMagnitude(minMagnitude);
        var rows = await store.QueryAsync(
            new EarthquakeQuery(rangeStart, rangeEnd, threshold, limit, Math.Max(0, offset ?? 0)),
            cancellationToken);
        var storedCount = await store.GetStoredCountAsync(cancellationToken);
        var isCovered = await store.IsCoveredAsync(rangeStart, rangeEnd, threshold, cancellationToken);

        return Results.Ok(new
        {
            type = "FeatureCollection",
            metadata = new
            {
                generated = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                count = rows.Count,
                storedCount,
                storage = "sqlite",
                isCovered,
                projectMinMagnitude = EarthquakeStore.ProjectMinMagnitude,
                minMagnitude = threshold,
                startTime = rangeStart,
                endTime = rangeEnd
            },
            features = rows.Select(row => new
            {
                type = "Feature",
                id = row.Id,
                geometry = new
                {
                    type = "Point",
                    coordinates = new[] { row.Longitude, row.Latitude, row.Depth }
                },
                properties = new
                {
                    mag = row.Magnitude,
                    place = row.Place,
                    time = row.Time,
                    updated = row.Updated,
                    url = row.Url,
                    alert = row.Alert,
                    tsunami = row.Tsunami,
                    sig = row.Significance
                }
            })
        });
    });

app.MapGet(
    "/api/catalog/bootstrap",
    async (
        EarthquakeStore store,
        CatalogSyncCoordinator syncCoordinator,
        CancellationToken cancellationToken) =>
    {
        var rangeStart = new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        var rangeEnd = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var storedCount = await store.CountAsync(
            rangeStart,
            rangeEnd,
            EarthquakeStore.ProjectMinMagnitude,
            cancellationToken);
        var isCovered = await store.IsCoveredAsync(
            rangeStart,
            rangeEnd,
            EarthquakeStore.ProjectMinMagnitude,
            cancellationToken);
        var syncStatus = await syncCoordinator.GetStatusAsync(cancellationToken);

        return Results.Ok(new
        {
            metadata = new
            {
                generated = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                count = storedCount,
                storedCount,
                storage = "sqlite",
                isCovered,
                projectMinMagnitude = EarthquakeStore.ProjectMinMagnitude,
                startTime = rangeStart,
                endTime = rangeEnd,
                dataFormat = "compact-v1",
                batchSizeSuggested = 5000,
                sync = syncStatus
            }
        });
    });

app.MapGet(
    "/api/catalog/bootstrap-batch",
    async (
        int? offset,
        int? limit,
        long? endTime,
        EarthquakeStore store,
        CatalogSyncCoordinator syncCoordinator,
        CancellationToken cancellationToken) =>
    {
        var rangeStart = new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        var rangeEnd = Math.Max(rangeStart, endTime ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        var batchOffset = Math.Max(0, offset ?? 0);
        var batchLimit = Math.Clamp(limit ?? 5000, 1000, 20000);
        var totalCount = await store.CountAsync(
            rangeStart,
            rangeEnd,
            EarthquakeStore.ProjectMinMagnitude,
            cancellationToken);
        var rows = await store.QueryAsync(
            new EarthquakeQuery(
                rangeStart,
                rangeEnd,
                EarthquakeStore.ProjectMinMagnitude,
                batchLimit,
                batchOffset),
            cancellationToken);
        var syncStatus = await syncCoordinator.GetStatusAsync(cancellationToken);
        var nextOffset = batchOffset + rows.Count;

        return Results.Ok(new
        {
            metadata = new
            {
                generated = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                totalCount,
                offset = batchOffset,
                limit = batchLimit,
                returnedCount = rows.Count,
                nextOffset,
                hasMore = nextOffset < totalCount,
                projectMinMagnitude = EarthquakeStore.ProjectMinMagnitude,
                startTime = rangeStart,
                endTime = rangeEnd,
                dataFormat = "compact-v1",
                sync = syncStatus
            },
            events = rows.Select(row => new object?[]
            {
                row.Id,
                row.Longitude,
                row.Latitude,
                row.Depth,
                row.Magnitude,
                row.Time,
                row.Updated,
                row.Place,
                row.Url,
                row.Alert,
                row.Tsunami,
                row.Significance
            })
        });
    });

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = new PhysicalFileProvider(root)
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(root),
    ServeUnknownFileTypes = true,
    OnPrepareResponse = context =>
    {
        var path = context.File.PhysicalPath ?? string.Empty;
        var extension = Path.GetExtension(path);
        if (extension.Equals(".html", StringComparison.OrdinalIgnoreCase) ||
            extension.Equals(".js", StringComparison.OrdinalIgnoreCase) ||
            extension.Equals(".css", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
            context.Context.Response.Headers.Pragma = "no-cache";
            context.Context.Response.Headers.Expires = "0";
        }
    }
});

app.Run();

internal sealed record SyncRequest(
    DateTimeOffset? Start,
    DateTimeOffset? End,
    double? MinMagnitude);

internal sealed record IngestRequest(IReadOnlyList<IngestEvent>? Events);

internal sealed record IngestEvent(
    string? Id,
    double? Lon,
    double? Lat,
    double? Depth,
    double? Mag,
    long? Time,
    long? Updated,
    string? Place,
    string? Url,
    string? Alert,
    int? Tsunami,
    int? Significance);
