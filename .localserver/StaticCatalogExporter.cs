using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;

namespace LocalQuakeServer;

internal static class StaticCatalogExporter
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Encoder = JavaScriptEncoder.Create(UnicodeRanges.All),
        WriteIndented = false
    };

    public static async Task<StaticCatalogExportSummary> ExportAsync(
        EarthquakeStore store,
        string outputPath,
        int batchSize,
        CancellationToken cancellationToken = default)
    {
        var catalogStart = new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        var catalogEnd = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var effectiveBatchSize = Math.Clamp(batchSize, 1_000, 20_000);

        Directory.CreateDirectory(outputPath);
        foreach (var existingBatch in Directory.EnumerateFiles(outputPath, "batch-*.json", SearchOption.TopDirectoryOnly))
        {
            File.Delete(existingBatch);
        }

        var totalCount = await store.CountAsync(
            catalogStart,
            catalogEnd,
            EarthquakeStore.ProjectMinMagnitude,
            cancellationToken);
        var batchCount = totalCount <= 0 ? 0 : (int)Math.Ceiling(totalCount / (double)effectiveBatchSize);
        var generated = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var latestRows = await store.QueryAsync(
            new EarthquakeQuery(
                catalogStart,
                catalogEnd,
                EarthquakeStore.ProjectMinMagnitude,
                1,
                0),
            cancellationToken);
        var actualCatalogEnd = latestRows.Count > 0 ? latestRows[0].Time : catalogStart;
        var batches = new List<StaticCatalogBatchManifest>(Math.Max(1, batchCount));

        for (var batchIndex = 0; batchIndex < batchCount; batchIndex += 1)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var offset = batchIndex * effectiveBatchSize;
            var rows = await store.QueryAsync(
                new EarthquakeQuery(
                    catalogStart,
                    catalogEnd,
                    EarthquakeStore.ProjectMinMagnitude,
                    effectiveBatchSize,
                    offset),
                cancellationToken);

            var fileName = $"batch-{batchIndex + 1:0000}.json";
            var nextOffset = offset + rows.Count;
            var batchPayload = new StaticCatalogBatchPayload(
                new StaticCatalogBatchMetadata(
                    generated,
                    totalCount,
                    offset,
                    effectiveBatchSize,
                    rows.Count,
                    nextOffset,
                    nextOffset < totalCount,
                    EarthquakeStore.ProjectMinMagnitude,
                    catalogStart,
                    actualCatalogEnd,
                    "compact-v1",
                    "static"),
                rows.Select(static row => new object?[]
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
                }).ToArray());

            await File.WriteAllTextAsync(
                Path.Combine(outputPath, fileName),
                JsonSerializer.Serialize(batchPayload, SerializerOptions),
                cancellationToken);

            batches.Add(new StaticCatalogBatchManifest(
                fileName,
                offset,
                effectiveBatchSize,
                rows.Count,
                nextOffset,
                nextOffset < totalCount));
        }

        var manifest = new StaticCatalogManifest(
            new StaticCatalogManifestMetadata(
                generated,
                totalCount,
                totalCount,
                "static-json",
                true,
                EarthquakeStore.ProjectMinMagnitude,
                catalogStart,
                actualCatalogEnd,
                "compact-v1",
                effectiveBatchSize,
                batchCount,
                "static"),
            batches);

        await File.WriteAllTextAsync(
            Path.Combine(outputPath, "manifest.json"),
            JsonSerializer.Serialize(manifest, SerializerOptions),
            cancellationToken);

        return new StaticCatalogExportSummary(outputPath, totalCount, batchCount, effectiveBatchSize);
    }
}

internal sealed record StaticCatalogExportSummary(
    string OutputPath,
    long TotalCount,
    int BatchCount,
    int BatchSize);

internal sealed record StaticCatalogManifest(
    StaticCatalogManifestMetadata Metadata,
    IReadOnlyList<StaticCatalogBatchManifest> Batches);

internal sealed record StaticCatalogManifestMetadata(
    long Generated,
    long Count,
    long StoredCount,
    string Storage,
    bool IsCovered,
    double ProjectMinMagnitude,
    long StartTime,
    long EndTime,
    string DataFormat,
    int BatchSizeSuggested,
    int BatchCount,
    string SourceMode);

internal sealed record StaticCatalogBatchManifest(
    string File,
    int Offset,
    int Limit,
    int ReturnedCount,
    int NextOffset,
    bool HasMore);

internal sealed record StaticCatalogBatchPayload(
    StaticCatalogBatchMetadata Metadata,
    IReadOnlyList<object?[]> Events);

internal sealed record StaticCatalogBatchMetadata(
    long Generated,
    long TotalCount,
    int Offset,
    int Limit,
    int ReturnedCount,
    int NextOffset,
    bool HasMore,
    double ProjectMinMagnitude,
    long StartTime,
    long EndTime,
    string DataFormat,
    string SourceMode);
