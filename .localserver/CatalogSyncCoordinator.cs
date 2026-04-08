namespace LocalQuakeServer;

internal sealed class CatalogSyncCoordinator(
    UsgsSyncService syncService,
    EarthquakeStore store,
    ILogger<CatalogSyncCoordinator> logger)
{
    private static readonly DateTimeOffset CatalogStart = new(1949, 1, 1, 0, 0, 0, TimeSpan.Zero);
    private readonly object _gate = new();
    private Task? _runningTask;
    private CatalogSyncStatus _status = CatalogSyncStatus.CreateIdle(
        EarthquakeStore.ProjectMinMagnitude,
        CatalogStart.ToUnixTimeMilliseconds());

    public async Task<CatalogSyncStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var storedCount = await store.GetStoredCountAsync(cancellationToken);
        var coverage = await store.GetCoverageStateAsync(
            CatalogStart.ToUnixTimeMilliseconds(),
            EarthquakeStore.ProjectMinMagnitude,
            cancellationToken);

        lock (_gate)
        {
            var requestedEnd = _status.RequestedEndTime > 0
                ? _status.RequestedEndTime
                : coverage.CoveredEndTime;

            return _status with
            {
                StoredCount = storedCount,
                CoveredStartTime = coverage.CoverageStartTime,
                CoveredEndTime = coverage.CoveredEndTime,
                IsCovered = coverage.HasCoverage && coverage.CoveredEndTime >= requestedEnd
            };
        }
    }

    public async Task<CatalogSyncStatus> EnsureFullCatalogSyncScheduledAsync(
        bool force = false,
        CancellationToken cancellationToken = default)
    {
        var targetEnd = DateTimeOffset.UtcNow;
        var targetEndTime = targetEnd.ToUnixTimeMilliseconds();
        var storedCount = await store.GetStoredCountAsync(cancellationToken);
        var coverage = await store.GetCoverageStateAsync(
            CatalogStart.ToUnixTimeMilliseconds(),
            EarthquakeStore.ProjectMinMagnitude,
            cancellationToken);

        lock (_gate)
        {
            if (_runningTask is { IsCompleted: false })
            {
                return _status with
                {
                    StoredCount = storedCount,
                    CoveredStartTime = coverage.CoverageStartTime,
                    CoveredEndTime = coverage.CoveredEndTime
                };
            }

            if (!force && coverage.HasCoverage && coverage.CoveredEndTime >= targetEndTime)
            {
                _status = CatalogSyncStatus.CreateCompleted(
                    EarthquakeStore.ProjectMinMagnitude,
                    CatalogStart.ToUnixTimeMilliseconds(),
                    targetEndTime,
                    coverage.CoveredEndTime,
                    storedCount);
                return _status;
            }

            var isFullSync = force || !coverage.HasCoverage;
            var requestedStartTime = isFullSync
                ? CatalogStart.ToUnixTimeMilliseconds()
                : Math.Min(targetEndTime, coverage.CoveredEndTime + 1);

            if (requestedStartTime > targetEndTime)
            {
                _status = CatalogSyncStatus.CreateCompleted(
                    EarthquakeStore.ProjectMinMagnitude,
                    CatalogStart.ToUnixTimeMilliseconds(),
                    targetEndTime,
                    coverage.CoveredEndTime,
                    storedCount);
                return _status;
            }

            var requestedStart = DateTimeOffset.FromUnixTimeMilliseconds(requestedStartTime);
            var runId = Guid.NewGuid().ToString("N");
            var totalChunks = EstimateChunkCount(requestedStart, targetEnd);
            var syncMode = isFullSync ? "full" : "incremental";

            _status = new CatalogSyncStatus(
                IsRunning: true,
                IsCovered: false,
                Phase: "scheduled",
                Message: isFullSync
                    ? "Initial full catalog sync scheduled."
                    : "Incremental catalog sync scheduled.",
                StartedAt: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                CompletedAt: null,
                RequestedStartTime: requestedStartTime,
                RequestedEndTime: targetEndTime,
                CoveredStartTime: coverage.CoverageStartTime,
                CoveredEndTime: coverage.CoveredEndTime,
                TargetEndTime: targetEndTime,
                MinMagnitude: EarthquakeStore.ProjectMinMagnitude,
                TotalChunks: totalChunks,
                CompletedChunks: 0,
                CurrentChunkIndex: 0,
                CurrentPageIndex: 0,
                FetchedCount: 0,
                InsertedCount: 0,
                UpdatedCount: 0,
                SkippedCount: 0,
                StoredCount: storedCount,
                IsFullSync: isFullSync,
                IsIncremental: !isFullSync,
                SyncMode: syncMode,
                LastError: null);

            _runningTask = Task.Run(
                () => RunCatalogSyncAsync(
                    runId,
                    requestedStart,
                    targetEnd,
                    isFullSync,
                    !isFullSync,
                    CancellationToken.None),
                CancellationToken.None);

            return _status;
        }
    }

    private async Task RunCatalogSyncAsync(
        string runId,
        DateTimeOffset rangeStart,
        DateTimeOffset rangeEnd,
        bool isFullSync,
        bool isIncremental,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation(
                "Starting {Mode} catalog sync from {Start} to {End} with M{MinMagnitude}+.",
                isFullSync ? "full" : "incremental",
                rangeStart,
                rangeEnd,
                EarthquakeStore.ProjectMinMagnitude);

            var progress = new Progress<SyncProgress>(UpdateProgress);
            var summary = await syncService.SyncAsync(
                rangeStart,
                rangeEnd,
                EarthquakeStore.ProjectMinMagnitude,
                progress,
                useSingleYearChunks: true,
                isFullSync: isFullSync,
                isIncremental: isIncremental,
                runId: runId,
                cancellationToken: cancellationToken);

            var storedCount = await store.GetStoredCountAsync(cancellationToken);
            var coverage = await store.GetCoverageStateAsync(
                CatalogStart.ToUnixTimeMilliseconds(),
                EarthquakeStore.ProjectMinMagnitude,
                cancellationToken);
            var completedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            lock (_gate)
            {
                _status = _status with
                {
                    IsRunning = false,
                    IsCovered = coverage.HasCoverage && coverage.CoveredEndTime >= rangeEnd.ToUnixTimeMilliseconds(),
                    Phase = "completed",
                    Message = isFullSync
                        ? "Initial full catalog sync completed."
                        : "Incremental catalog sync completed.",
                    CompletedAt = completedAt,
                    CompletedChunks = Math.Max(_status.CompletedChunks, _status.TotalChunks),
                    FetchedCount = summary.FetchedCount,
                    InsertedCount = summary.InsertedCount,
                    UpdatedCount = summary.UpdatedCount,
                    SkippedCount = summary.SkippedCount,
                    StoredCount = storedCount,
                    CoveredStartTime = coverage.CoverageStartTime,
                    CoveredEndTime = coverage.CoveredEndTime,
                    IsFullSync = isFullSync,
                    IsIncremental = isIncremental,
                    SyncMode = isFullSync ? "full" : "incremental",
                    LastError = null
                };
            }

            logger.LogInformation(
                "{Mode} catalog sync completed. fetched={FetchedCount}, inserted={InsertedCount}, updated={UpdatedCount}, skipped={SkippedCount}, stored={StoredCount}.",
                isFullSync ? "Full" : "Incremental",
                summary.FetchedCount,
                summary.InsertedCount,
                summary.UpdatedCount,
                summary.SkippedCount,
                storedCount);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Catalog sync failed.");

            var coverage = await store.GetCoverageStateAsync(
                CatalogStart.ToUnixTimeMilliseconds(),
                EarthquakeStore.ProjectMinMagnitude,
                CancellationToken.None);
            var storedCount = await store.GetStoredCountAsync(CancellationToken.None);

            lock (_gate)
            {
                _status = _status with
                {
                    IsRunning = false,
                    IsCovered = false,
                    Phase = "failed",
                    Message = isFullSync
                        ? "Initial full catalog sync failed."
                        : "Incremental catalog sync failed.",
                    CompletedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    StoredCount = storedCount,
                    CoveredStartTime = coverage.CoverageStartTime,
                    CoveredEndTime = coverage.CoveredEndTime,
                    LastError = exception.Message
                };
            }
        }
    }

    private void UpdateProgress(SyncProgress progress)
    {
        lock (_gate)
        {
            _status = _status with
            {
                IsRunning = true,
                IsCovered = false,
                Phase = progress.Phase,
                Message = progress.Message,
                RequestedStartTime = progress.RequestedStartTime,
                RequestedEndTime = progress.RequestedEndTime,
                TargetEndTime = progress.RequestedEndTime,
                MinMagnitude = progress.MinMagnitude,
                TotalChunks = progress.TotalChunks,
                CompletedChunks = progress.CompletedChunks,
                CurrentChunkIndex = progress.CurrentChunkIndex,
                CurrentPageIndex = progress.CurrentPageIndex,
                FetchedCount = progress.FetchedCount,
                InsertedCount = progress.InsertedCount,
                UpdatedCount = progress.UpdatedCount,
                SkippedCount = progress.SkippedCount,
                StoredCount = progress.StoredCount > 0 ? progress.StoredCount : _status.StoredCount,
                IsFullSync = progress.IsFullSync,
                IsIncremental = progress.IsIncremental,
                SyncMode = progress.IsFullSync ? "full" : "incremental"
            };
        }
    }

    private static int EstimateChunkCount(DateTimeOffset start, DateTimeOffset end)
    {
        if (end < start)
        {
            return 0;
        }

        return Math.Max(1, end.UtcDateTime.Year - start.UtcDateTime.Year + 1);
    }
}

internal sealed record CatalogSyncStatus(
    bool IsRunning,
    bool IsCovered,
    string Phase,
    string Message,
    long? StartedAt,
    long? CompletedAt,
    long RequestedStartTime,
    long RequestedEndTime,
    long CoveredStartTime,
    long CoveredEndTime,
    long TargetEndTime,
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
    string SyncMode,
    string? LastError)
{
    public static CatalogSyncStatus CreateIdle(double minMagnitude, long requestedStartTime) =>
        new(
            IsRunning: false,
            IsCovered: false,
            Phase: "idle",
            Message: "Catalog sync has not started yet.",
            StartedAt: null,
            CompletedAt: null,
            RequestedStartTime: requestedStartTime,
            RequestedEndTime: 0,
            CoveredStartTime: requestedStartTime,
            CoveredEndTime: requestedStartTime - 1,
            TargetEndTime: 0,
            MinMagnitude: minMagnitude,
            TotalChunks: 0,
            CompletedChunks: 0,
            CurrentChunkIndex: 0,
            CurrentPageIndex: 0,
            FetchedCount: 0,
            InsertedCount: 0,
            UpdatedCount: 0,
            SkippedCount: 0,
            StoredCount: 0,
            IsFullSync: false,
            IsIncremental: false,
            SyncMode: "idle",
            LastError: null);

    public static CatalogSyncStatus CreateCompleted(
        double minMagnitude,
        long requestedStartTime,
        long targetEndTime,
        long coveredEndTime,
        long storedCount) =>
        new(
            IsRunning: false,
            IsCovered: coveredEndTime >= targetEndTime,
            Phase: "completed",
            Message: "Local catalog is up to date.",
            StartedAt: null,
            CompletedAt: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            RequestedStartTime: requestedStartTime,
            RequestedEndTime: targetEndTime,
            CoveredStartTime: requestedStartTime,
            CoveredEndTime: coveredEndTime,
            TargetEndTime: targetEndTime,
            MinMagnitude: minMagnitude,
            TotalChunks: 0,
            CompletedChunks: 0,
            CurrentChunkIndex: 0,
            CurrentPageIndex: 0,
            FetchedCount: 0,
            InsertedCount: 0,
            UpdatedCount: 0,
            SkippedCount: 0,
            StoredCount: storedCount,
            IsFullSync: false,
            IsIncremental: false,
            SyncMode: "idle",
            LastError: null);
}
