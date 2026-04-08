using System.Diagnostics;
using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LocalQuakeServer;

internal sealed class UsgsSyncService(HttpClient httpClient, EarthquakeStore store)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private const string QueryUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query";
    private const int PageSize = 20000;

    public async Task<SyncSummary> SyncAsync(
        DateTimeOffset start,
        DateTimeOffset end,
        double minMagnitude,
        IProgress<SyncProgress>? progress = null,
        bool useSingleYearChunks = false,
        bool isFullSync = false,
        bool isIncremental = false,
        string? runId = null,
        CancellationToken cancellationToken = default)
    {
        var effectiveMinMagnitude = Math.Max(EarthquakeStore.ProjectMinMagnitude, minMagnitude);
        var normalizedRunId = string.IsNullOrWhiteSpace(runId) ? Guid.NewGuid().ToString("N") : runId;
        var chunks = BuildChunks(start, end, effectiveMinMagnitude, useSingleYearChunks);

        if (start > end)
        {
            var storedCount = await store.GetStoredCountAsync(cancellationToken);
            progress?.Report(new SyncProgress(
                RequestedStartTime: start.ToUnixTimeMilliseconds(),
                RequestedEndTime: end.ToUnixTimeMilliseconds(),
                MinMagnitude: effectiveMinMagnitude,
                TotalChunks: 0,
                CompletedChunks: 0,
                CurrentChunkIndex: 0,
                CurrentPageIndex: 0,
                FetchedCount: 0,
                InsertedCount: 0,
                UpdatedCount: 0,
                SkippedCount: 0,
                StoredCount: storedCount,
                IsFullSync: isFullSync,
                IsIncremental: isIncremental,
                Phase: "completed",
                Message: "No sync work required."));

            return new SyncSummary(
                StartTime: start.ToUnixTimeMilliseconds(),
                EndTime: end.ToUnixTimeMilliseconds(),
                MinMagnitude: effectiveMinMagnitude,
                ChunkCount: 0,
                FetchedCount: 0,
                InsertedCount: 0,
                UpdatedCount: 0,
                SkippedCount: 0,
                StoredCount: storedCount,
                DatabasePath: store.DatabasePath,
                IsFullSync: isFullSync,
                IsIncremental: isIncremental);
        }

        var fetchedCount = 0;
        var insertedCount = 0;
        var updatedCount = 0;
        var skippedCount = 0;

        progress?.Report(new SyncProgress(
            RequestedStartTime: start.ToUnixTimeMilliseconds(),
            RequestedEndTime: end.ToUnixTimeMilliseconds(),
            MinMagnitude: effectiveMinMagnitude,
            TotalChunks: chunks.Count,
            CompletedChunks: 0,
            CurrentChunkIndex: 0,
            CurrentPageIndex: 0,
            FetchedCount: 0,
            InsertedCount: 0,
            UpdatedCount: 0,
            SkippedCount: 0,
            StoredCount: 0,
            IsFullSync: isFullSync,
            IsIncremental: isIncremental,
            Phase: "starting",
            Message: $"Preparing {chunks.Count} sync chunks."));

        for (var chunkIndex = 0; chunkIndex < chunks.Count; chunkIndex += 1)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var chunk = chunks[chunkIndex];
            var pageIndex = 0;
            var chunkStartedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var chunkFetched = 0;
            var chunkInserted = 0;
            var chunkUpdated = 0;
            var chunkSkipped = 0;

            progress?.Report(new SyncProgress(
                RequestedStartTime: start.ToUnixTimeMilliseconds(),
                RequestedEndTime: end.ToUnixTimeMilliseconds(),
                MinMagnitude: effectiveMinMagnitude,
                TotalChunks: chunks.Count,
                CompletedChunks: chunkIndex,
                CurrentChunkIndex: chunkIndex + 1,
                CurrentPageIndex: 0,
                FetchedCount: fetchedCount,
                InsertedCount: insertedCount,
                UpdatedCount: updatedCount,
                SkippedCount: skippedCount,
                StoredCount: 0,
                IsFullSync: isFullSync,
                IsIncremental: isIncremental,
                Phase: "chunk-start",
                Message: $"Syncing chunk {chunkIndex + 1}/{chunks.Count}."));

            try
            {
                while (true)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    var offset = pageIndex * PageSize + 1;
                    var url = BuildUrl(chunk.Start, chunk.End, effectiveMinMagnitude, offset);
                    var payload = await FetchPayloadAsync(url, cancellationToken);

                    var batch = (payload?.Features ?? [])
                        .Select(MapFeature)
                        .OfType<EarthquakeRecord>()
                        .ToArray();

                    if (batch.Length == 0)
                    {
                        break;
                    }

                    var batchResult = await store.UpsertBatchAsync(batch, cancellationToken);
                    chunkFetched += batchResult.FetchedCount;
                    chunkInserted += batchResult.InsertedCount;
                    chunkUpdated += batchResult.UpdatedCount;
                    chunkSkipped += batchResult.SkippedCount;
                    fetchedCount += batchResult.FetchedCount;
                    insertedCount += batchResult.InsertedCount;
                    updatedCount += batchResult.UpdatedCount;
                    skippedCount += batchResult.SkippedCount;

                    progress?.Report(new SyncProgress(
                        RequestedStartTime: start.ToUnixTimeMilliseconds(),
                        RequestedEndTime: end.ToUnixTimeMilliseconds(),
                        MinMagnitude: effectiveMinMagnitude,
                        TotalChunks: chunks.Count,
                        CompletedChunks: chunkIndex,
                        CurrentChunkIndex: chunkIndex + 1,
                        CurrentPageIndex: pageIndex + 1,
                        FetchedCount: fetchedCount,
                        InsertedCount: insertedCount,
                        UpdatedCount: updatedCount,
                        SkippedCount: skippedCount,
                        StoredCount: 0,
                        IsFullSync: isFullSync,
                        IsIncremental: isIncremental,
                        Phase: "page",
                        Message: $"Chunk {chunkIndex + 1}/{chunks.Count}, page {pageIndex + 1}: fetched {fetchedCount}, inserted {insertedCount}, updated {updatedCount}."));

                    if (batch.Length < PageSize)
                    {
                        break;
                    }

                    pageIndex += 1;
                }

                var storedCount = await store.GetStoredCountAsync(cancellationToken);
                var completedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await store.RegisterSyncRunAsync(
                    new SyncRunRecord(
                        RunId: normalizedRunId,
                        RequestedStartTime: start.ToUnixTimeMilliseconds(),
                        RequestedEndTime: end.ToUnixTimeMilliseconds(),
                        StartTime: chunk.Start.ToUnixTimeMilliseconds(),
                        EndTime: chunk.End.ToUnixTimeMilliseconds(),
                        MinMagnitude: effectiveMinMagnitude,
                        FetchedCount: chunkFetched,
                        InsertedCount: chunkInserted,
                        UpdatedCount: chunkUpdated,
                        SkippedCount: chunkSkipped,
                        StoredCount: storedCount,
                        TotalChunks: chunks.Count,
                        ChunkIndex: chunkIndex + 1,
                        Status: "completed",
                        IsFullSync: isFullSync,
                        IsIncremental: isIncremental,
                        StartedAt: chunkStartedAt,
                        CompletedAt: completedAt,
                        FailedAt: 0,
                        ErrorMessage: string.Empty),
                    cancellationToken);

                progress?.Report(new SyncProgress(
                    RequestedStartTime: start.ToUnixTimeMilliseconds(),
                    RequestedEndTime: end.ToUnixTimeMilliseconds(),
                    MinMagnitude: effectiveMinMagnitude,
                    TotalChunks: chunks.Count,
                    CompletedChunks: chunkIndex + 1,
                    CurrentChunkIndex: chunkIndex + 1,
                    CurrentPageIndex: pageIndex + 1,
                    FetchedCount: fetchedCount,
                    InsertedCount: insertedCount,
                    UpdatedCount: updatedCount,
                    SkippedCount: skippedCount,
                    StoredCount: storedCount,
                    IsFullSync: isFullSync,
                    IsIncremental: isIncremental,
                    Phase: "chunk-complete",
                    Message: $"Completed chunk {chunkIndex + 1}/{chunks.Count}."));
            }
            catch (Exception exception)
            {
                var failedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var storedCount = await store.GetStoredCountAsync(CancellationToken.None);
                await store.RegisterSyncRunAsync(
                    new SyncRunRecord(
                        RunId: normalizedRunId,
                        RequestedStartTime: start.ToUnixTimeMilliseconds(),
                        RequestedEndTime: end.ToUnixTimeMilliseconds(),
                        StartTime: chunk.Start.ToUnixTimeMilliseconds(),
                        EndTime: chunk.End.ToUnixTimeMilliseconds(),
                        MinMagnitude: effectiveMinMagnitude,
                        FetchedCount: chunkFetched,
                        InsertedCount: chunkInserted,
                        UpdatedCount: chunkUpdated,
                        SkippedCount: chunkSkipped,
                        StoredCount: storedCount,
                        TotalChunks: chunks.Count,
                        ChunkIndex: chunkIndex + 1,
                        Status: "failed",
                        IsFullSync: isFullSync,
                        IsIncremental: isIncremental,
                        StartedAt: chunkStartedAt,
                        CompletedAt: 0,
                        FailedAt: failedAt,
                        ErrorMessage: exception.Message),
                    CancellationToken.None);

                throw;
            }
        }

        var finalStoredCount = await store.GetStoredCountAsync(cancellationToken);
        progress?.Report(new SyncProgress(
            RequestedStartTime: start.ToUnixTimeMilliseconds(),
            RequestedEndTime: end.ToUnixTimeMilliseconds(),
            MinMagnitude: effectiveMinMagnitude,
            TotalChunks: chunks.Count,
            CompletedChunks: chunks.Count,
            CurrentChunkIndex: chunks.Count,
            CurrentPageIndex: 0,
            FetchedCount: fetchedCount,
            InsertedCount: insertedCount,
            UpdatedCount: updatedCount,
            SkippedCount: skippedCount,
            StoredCount: finalStoredCount,
            IsFullSync: isFullSync,
            IsIncremental: isIncremental,
            Phase: "completed",
            Message: "Sync completed."));

        return new SyncSummary(
            StartTime: start.ToUnixTimeMilliseconds(),
            EndTime: end.ToUnixTimeMilliseconds(),
            MinMagnitude: effectiveMinMagnitude,
            ChunkCount: chunks.Count,
            FetchedCount: fetchedCount,
            InsertedCount: insertedCount,
            UpdatedCount: updatedCount,
            SkippedCount: skippedCount,
            StoredCount: finalStoredCount,
            DatabasePath: store.DatabasePath,
            IsFullSync: isFullSync,
            IsIncremental: isIncremental);
    }

    private async Task<UsgsFeatureCollection?> FetchPayloadAsync(
        string url,
        CancellationToken cancellationToken)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<UsgsFeatureCollection>(
                url,
                cancellationToken);
        }
        catch (HttpRequestException) when (OperatingSystem.IsWindows())
        {
            return await FetchPayloadWithPowerShellAsync(url, cancellationToken);
        }
    }

    private static async Task<UsgsFeatureCollection?> FetchPayloadWithPowerShellAsync(
        string url,
        CancellationToken cancellationToken)
    {
        var escapedUrl = url.Replace("'", "''");
        var command =
            $"[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; (Invoke-WebRequest -UseBasicParsing '{escapedUrl}').Content";

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            WorkingDirectory = Directory.GetCurrentDirectory()
        };
        startInfo.ArgumentList.Add("-NoLogo");
        startInfo.ArgumentList.Add("-NoProfile");
        startInfo.ArgumentList.Add("-Command");
        startInfo.ArgumentList.Add(command);

        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start PowerShell fallback for USGS sync.");

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

        await process.WaitForExitAsync(cancellationToken);
        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"PowerShell fallback failed while requesting USGS: {stderr}".Trim());
        }

        return JsonSerializer.Deserialize<UsgsFeatureCollection>(stdout, SerializerOptions);
    }

    private static IReadOnlyList<SyncChunk> BuildChunks(
        DateTimeOffset start,
        DateTimeOffset end,
        double minMagnitude,
        bool useSingleYearChunks = false)
    {
        var spanYears = Math.Max(1, (end - start).TotalDays / 365.25);
        var stepYears = useSingleYearChunks ? 1 : 1;

        if (!useSingleYearChunks && spanYears > 20 && minMagnitude >= 5.5)
        {
            stepYears = 10;
        }
        else if (!useSingleYearChunks && spanYears > 20 && minMagnitude >= 4)
        {
            stepYears = 5;
        }
        else if (!useSingleYearChunks && spanYears > 20 && minMagnitude >= 3)
        {
            stepYears = 3;
        }
        else if (!useSingleYearChunks && spanYears > 8)
        {
            stepYears = 2;
        }

        if (spanYears <= 1)
        {
            return [new SyncChunk(start, end)];
        }

        var chunks = new List<SyncChunk>();
        var cursorYear = start.UtcDateTime.Year;
        var endYear = end.UtcDateTime.Year;

        while (cursorYear <= endYear)
        {
            var chunkStart = DateTimeOffset.FromUnixTimeMilliseconds(Math.Max(
                start.ToUnixTimeMilliseconds(),
                new DateTimeOffset(cursorYear, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds()));
            var chunkEnd = DateTimeOffset.FromUnixTimeMilliseconds(Math.Min(
                end.ToUnixTimeMilliseconds(),
                new DateTimeOffset(cursorYear + stepYears, 1, 1, 0, 0, 0, TimeSpan.Zero)
                    .AddMilliseconds(-1)
                    .ToUnixTimeMilliseconds()));

            chunks.Add(new SyncChunk(chunkStart, chunkEnd));
            cursorYear += stepYears;
        }

        return chunks;
    }

    private static string BuildUrl(
        DateTimeOffset start,
        DateTimeOffset end,
        double minMagnitude,
        int offset)
    {
        var url = new UriBuilder(QueryUrl);
        var query = new Dictionary<string, string?>
        {
            ["format"] = "geojson",
            ["eventtype"] = "earthquake",
            ["orderby"] = "time",
            ["starttime"] = start.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            ["endtime"] = end.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            ["minmagnitude"] = minMagnitude.ToString("0.0", CultureInfo.InvariantCulture),
            ["limit"] = PageSize.ToString(CultureInfo.InvariantCulture),
            ["offset"] = offset.ToString(CultureInfo.InvariantCulture)
        };

        url.Query = string.Join("&", query.Select(pair =>
            $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value ?? string.Empty)}"));
        return url.ToString();
    }

    private static EarthquakeRecord? MapFeature(UsgsFeature feature)
    {
        var coords = feature.Geometry?.Coordinates;
        var props = feature.Properties;
        if (coords is null || coords.Length < 3 || props?.Mag is null || props.Time is null)
        {
            return null;
        }

        if (props.Mag.Value < EarthquakeStore.ProjectMinMagnitude)
        {
            return null;
        }

        if (!TryReadCoordinate(coords[0], out var longitude) ||
            !TryReadCoordinate(coords[1], out var latitude))
        {
            return null;
        }

        var depth = TryReadCoordinate(coords[2], out var rawDepth)
            ? Math.Max(0, rawDepth)
            : 0;

        return new EarthquakeRecord(
            string.IsNullOrWhiteSpace(feature.Id)
                ? $"{props.Time}-{longitude}-{latitude}"
                : feature.Id,
            longitude,
            latitude,
            depth,
            props.Mag.Value,
            props.Time.Value,
            props.Updated ?? props.Time.Value,
            props.Place ?? "Unknown location",
            props.Url ?? string.Empty,
            props.Alert ?? string.Empty,
            props.Tsunami ?? 0,
            props.Significance ?? 0,
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
    }

    private static bool TryReadCoordinate(JsonElement element, out double value)
    {
        value = 0;

        if (element.ValueKind == JsonValueKind.Number)
        {
            return element.TryGetDouble(out value);
        }

        if (element.ValueKind == JsonValueKind.String)
        {
            return double.TryParse(
                element.GetString(),
                NumberStyles.Float | NumberStyles.AllowThousands,
                CultureInfo.InvariantCulture,
                out value);
        }

        return false;
    }
}

internal sealed record SyncChunk(DateTimeOffset Start, DateTimeOffset End);

internal sealed record SyncSummary(
    long StartTime,
    long EndTime,
    double MinMagnitude,
    int ChunkCount,
    int FetchedCount,
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount,
    long StoredCount,
    string DatabasePath,
    bool IsFullSync,
    bool IsIncremental);

internal sealed record SyncProgress(
    long RequestedStartTime,
    long RequestedEndTime,
    double MinMagnitude,
    int TotalChunks,
    int CompletedChunks,
    int CurrentChunkIndex,
    int CurrentPageIndex,
    int FetchedCount,
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount,
    long StoredCount,
    bool IsFullSync,
    bool IsIncremental,
    string Phase,
    string Message);

internal sealed record UsgsFeatureCollection(UsgsFeature[]? Features);

internal sealed record UsgsFeature(
    string? Id,
    UsgsGeometry? Geometry,
    UsgsProperties? Properties);

internal sealed record UsgsGeometry(JsonElement[]? Coordinates);

internal sealed record UsgsProperties(
    double? Mag,
    string? Place,
    long? Time,
    long? Updated,
    string? Url,
    string? Alert,
    int? Tsunami,
    [property: JsonPropertyName("sig")] int? Significance);
