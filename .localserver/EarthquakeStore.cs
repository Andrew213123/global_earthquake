using System.Globalization;
using System.Text.Json;

namespace LocalQuakeServer;

internal sealed class EarthquakeStore : IAsyncDisposable
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IntPtr _connection = IntPtr.Zero;
    private bool _initialized;
    public const double ProjectMinMagnitude = 3.0;

    public EarthquakeStore()
    {
        var projectRoot = Directory.GetCurrentDirectory();
        var databaseRoot = Path.Combine(projectRoot, ".localdata");
        var legacyRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "QuakePrototype");

        Directory.CreateDirectory(databaseRoot);
        Directory.CreateDirectory(legacyRoot);

        DatabasePath = Path.Combine(databaseRoot, "earthquakes.db");
        LegacyStorePath = Path.Combine(legacyRoot, "earthquakes.ndjson");
        LegacySyncRunPath = Path.Combine(legacyRoot, "sync-runs.ndjson");
    }

    public string DatabasePath { get; }
    public string StorePath => DatabasePath;
    public string LegacyStorePath { get; }
    public string LegacySyncRunPath { get; }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_initialized)
            {
                return;
            }

            _connection = SqliteNative.Open(DatabasePath);
            SqliteNative.Execute(_connection, """
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL;
                PRAGMA temp_store = MEMORY;
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS earthquakes (
                    id TEXT PRIMARY KEY,
                    longitude REAL NOT NULL,
                    latitude REAL NOT NULL,
                    depth REAL NOT NULL,
                    magnitude REAL NOT NULL,
                    time INTEGER NOT NULL,
                    updated INTEGER NOT NULL,
                    place TEXT NOT NULL,
                    url TEXT NOT NULL,
                    alert TEXT NOT NULL,
                    tsunami INTEGER NOT NULL,
                    significance INTEGER NOT NULL,
                    synced_at INTEGER NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_earthquakes_time
                    ON earthquakes(time DESC);

                CREATE INDEX IF NOT EXISTS idx_earthquakes_magnitude_time
                    ON earthquakes(magnitude DESC, time DESC);

                CREATE INDEX IF NOT EXISTS idx_earthquakes_project_time
                    ON earthquakes(time DESC)
                    WHERE magnitude >= 3.0;

                CREATE INDEX IF NOT EXISTS idx_earthquakes_project_magnitude_time
                    ON earthquakes(magnitude DESC, time DESC)
                    WHERE magnitude >= 3.0;

                CREATE TABLE IF NOT EXISTS sync_runs (
                    run_id TEXT NOT NULL DEFAULT '',
                    requested_start_time INTEGER NOT NULL DEFAULT 0,
                    requested_end_time INTEGER NOT NULL DEFAULT 0,
                    start_time INTEGER NOT NULL,
                    end_time INTEGER NOT NULL,
                    min_magnitude REAL NOT NULL,
                    fetched_count INTEGER NOT NULL DEFAULT 0,
                    inserted_count INTEGER NOT NULL DEFAULT 0,
                    updated_count INTEGER NOT NULL DEFAULT 0,
                    skipped_count INTEGER NOT NULL DEFAULT 0,
                    stored_count INTEGER NOT NULL DEFAULT 0,
                    total_chunks INTEGER NOT NULL DEFAULT 1,
                    chunk_index INTEGER NOT NULL DEFAULT 1,
                    status TEXT NOT NULL DEFAULT 'completed',
                    is_full_sync INTEGER NOT NULL DEFAULT 0,
                    is_incremental INTEGER NOT NULL DEFAULT 0,
                    started_at INTEGER NOT NULL DEFAULT 0,
                    completed_at INTEGER NOT NULL DEFAULT 0,
                    failed_at INTEGER NOT NULL DEFAULT 0,
                    error_message TEXT NOT NULL DEFAULT ''
                );
                """);

            EnsureSyncRunSchema();
            await MigrateLegacyFilesAsync(cancellationToken);
            NormalizeProjectScaleData();
            EnsureSyncRunDefaults();
            _initialized = true;
        }
        catch
        {
            if (_connection != IntPtr.Zero)
            {
                SqliteNative.Close(_connection);
                _connection = IntPtr.Zero;
            }

            throw;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<long> GetStoredCountAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            EnsureInitialized();
            return ExecuteScalarLong(
                $"SELECT COUNT(*) FROM earthquakes WHERE magnitude >= {ProjectMinMagnitude.ToString(CultureInfo.InvariantCulture)};");
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<long> CountAsync(
        long startTime,
        long endTime,
        double minMagnitude,
        CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            EnsureInitialized();
            var effectiveMinMagnitude = NormalizeMinMagnitude(minMagnitude);
            using var statement = SqliteNative.Prepare(
                _connection,
                """
                SELECT COUNT(*)
                FROM earthquakes
                WHERE time >= ?1
                  AND time <= ?2
                  AND magnitude >= ?3;
                """);
            statement.BindInt64(1, startTime);
            statement.BindInt64(2, endTime);
            statement.BindDouble(3, effectiveMinMagnitude);
            return statement.StepRow() ? statement.GetInt64(0) : 0;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<UpsertBatchResult> UpsertBatchAsync(
        IReadOnlyList<EarthquakeRecord> records,
        CancellationToken cancellationToken = default)
    {
        if (records.Count == 0)
        {
            return UpsertBatchResult.Empty;
        }

        var filteredRecords = records
            .Where(record => record.Magnitude >= ProjectMinMagnitude)
            .ToArray();

        if (filteredRecords.Length == 0)
        {
            return UpsertBatchResult.Empty;
        }

        await _gate.WaitAsync(cancellationToken);
        try
        {
            EnsureInitialized();
            return UpsertBatchCore(filteredRecords, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<IReadOnlyList<EarthquakeRecord>> QueryAsync(
        EarthquakeQuery query,
        CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            EnsureInitialized();
            var effectiveMinMagnitude = NormalizeMinMagnitude(query.MinMagnitude);

            var sql = """
                SELECT
                    id,
                    longitude,
                    latitude,
                    depth,
                    magnitude,
                    time,
                    updated,
                    place,
                    url,
                    alert,
                    tsunami,
                    significance,
                    synced_at
                FROM earthquakes
                WHERE time >= ?1
                  AND time <= ?2
                  AND magnitude >= ?3
                ORDER BY time DESC
                """ + (query.Limit is int ? "\nLIMIT ?4 OFFSET ?5;" : ";");

            using var statement = SqliteNative.Prepare(_connection, sql);
            statement.BindInt64(1, query.StartTime);
            statement.BindInt64(2, query.EndTime);
            statement.BindDouble(3, effectiveMinMagnitude);
            if (query.Limit is int limit)
            {
                statement.BindInt(4, limit);
                statement.BindInt(5, Math.Max(0, query.Offset));
            }

            var rows = new List<EarthquakeRecord>();
            while (statement.StepRow())
            {
                cancellationToken.ThrowIfCancellationRequested();
                rows.Add(new EarthquakeRecord(
                    statement.GetString(0),
                    statement.GetDouble(1),
                    statement.GetDouble(2),
                    statement.GetDouble(3),
                    statement.GetDouble(4),
                    statement.GetInt64(5),
                    statement.GetInt64(6),
                    statement.GetString(7),
                    statement.GetString(8),
                    statement.GetString(9),
                    statement.GetInt(10),
                    statement.GetInt(11),
                    statement.GetInt64(12)));
            }

            return rows;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task RegisterSyncRunAsync(
        SyncRunRecord run,
        CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            EnsureInitialized();
            RegisterSyncRunCore(run with { MinMagnitude = NormalizeMinMagnitude(run.MinMagnitude) });
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<SyncCoverageState> GetCoverageStateAsync(
        long coverageStartTime,
        double minMagnitude,
        CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            EnsureInitialized();
            return GetCoverageStateCore(coverageStartTime, NormalizeMinMagnitude(minMagnitude));
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<bool> IsCoveredAsync(
        long startTime,
        long endTime,
        double minMagnitude,
        CancellationToken cancellationToken = default)
    {
        var coverage = await GetCoverageStateAsync(startTime, minMagnitude, cancellationToken);
        return coverage.HasCoverage && coverage.CoveredEndTime >= endTime;
    }

    public async ValueTask DisposeAsync()
    {
        await _gate.WaitAsync();
        try
        {
            if (_connection != IntPtr.Zero)
            {
                SqliteNative.Close(_connection);
                _connection = IntPtr.Zero;
            }

            _initialized = false;
        }
        finally
        {
            _gate.Release();
            _gate.Dispose();
        }
    }

    private void EnsureInitialized()
    {
        if (!_initialized || _connection == IntPtr.Zero)
        {
            throw new InvalidOperationException("EarthquakeStore has not been initialized.");
        }
    }

    private long ExecuteScalarLong(string sql)
    {
        using var statement = SqliteNative.Prepare(_connection, sql);
        return statement.StepRow() ? statement.GetInt64(0) : 0;
    }

    private static double NormalizeMinMagnitude(double minMagnitude)
    {
        if (double.IsNaN(minMagnitude) || double.IsInfinity(minMagnitude))
        {
            return ProjectMinMagnitude;
        }

        return Math.Max(ProjectMinMagnitude, minMagnitude);
    }

    private void NormalizeProjectScaleData()
    {
        SqliteNative.Execute(
            _connection,
            $"""
            DELETE FROM earthquakes
            WHERE magnitude < {ProjectMinMagnitude.ToString(CultureInfo.InvariantCulture)};

            UPDATE sync_runs
            SET min_magnitude = {ProjectMinMagnitude.ToString(CultureInfo.InvariantCulture)}
            WHERE min_magnitude < {ProjectMinMagnitude.ToString(CultureInfo.InvariantCulture)};

            PRAGMA optimize;
            """);
    }

    private UpsertBatchResult UpsertBatchCore(
        IReadOnlyList<EarthquakeRecord> records,
        CancellationToken cancellationToken)
    {
        SqliteNative.Execute(_connection, "BEGIN IMMEDIATE TRANSACTION;");
        try
        {
            using var selectStatement = SqliteNative.Prepare(
                _connection,
                """
                SELECT
                    longitude,
                    latitude,
                    depth,
                    magnitude,
                    time,
                    updated,
                    place,
                    url,
                    alert,
                    tsunami,
                    significance
                FROM earthquakes
                WHERE id = ?1
                LIMIT 1;
                """);
            using var insertStatement = SqliteNative.Prepare(
                _connection,
                """
                INSERT INTO earthquakes (
                    id,
                    longitude,
                    latitude,
                    depth,
                    magnitude,
                    time,
                    updated,
                    place,
                    url,
                    alert,
                    tsunami,
                    significance,
                    synced_at
                )
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);
                """);
            using var updateStatement = SqliteNative.Prepare(
                _connection,
                """
                UPDATE earthquakes
                SET
                    longitude = ?2,
                    latitude = ?3,
                    depth = ?4,
                    magnitude = ?5,
                    time = ?6,
                    updated = ?7,
                    place = ?8,
                    url = ?9,
                    alert = ?10,
                    tsunami = ?11,
                    significance = ?12,
                    synced_at = ?13
                WHERE id = ?1;
                """);

            var insertedCount = 0;
            var updatedCount = 0;
            var skippedCount = 0;

            foreach (var record in records)
            {
                cancellationToken.ThrowIfCancellationRequested();
                selectStatement.BindText(1, record.Id);
                var exists = selectStatement.StepRow();

                if (!exists)
                {
                    BindEarthquakeRecord(insertStatement, record);
                    insertStatement.StepDone();
                    insertStatement.Reset();
                    insertedCount += 1;
                    selectStatement.Reset();
                    continue;
                }

                var existing = new ExistingEarthquakeRecord(
                    selectStatement.GetDouble(0),
                    selectStatement.GetDouble(1),
                    selectStatement.GetDouble(2),
                    selectStatement.GetDouble(3),
                    selectStatement.GetInt64(4),
                    selectStatement.GetInt64(5),
                    selectStatement.GetString(6),
                    selectStatement.GetString(7),
                    selectStatement.GetString(8),
                    selectStatement.GetInt(9),
                    selectStatement.GetInt(10));
                selectStatement.Reset();

                if (AreEquivalent(existing, record))
                {
                    skippedCount += 1;
                    continue;
                }

                BindEarthquakeRecord(updateStatement, record);
                updateStatement.StepDone();
                updateStatement.Reset();
                updatedCount += 1;
            }

            SqliteNative.Execute(_connection, "COMMIT;");
            return new UpsertBatchResult(
                FetchedCount: records.Count,
                InsertedCount: insertedCount,
                UpdatedCount: updatedCount,
                SkippedCount: skippedCount);
        }
        catch
        {
            SqliteNative.Execute(_connection, "ROLLBACK;");
            throw;
        }
    }

    private static void BindEarthquakeRecord(SqliteNative.SqliteStatement statement, EarthquakeRecord record)
    {
        statement.BindText(1, record.Id);
        statement.BindDouble(2, record.Longitude);
        statement.BindDouble(3, record.Latitude);
        statement.BindDouble(4, record.Depth);
        statement.BindDouble(5, record.Magnitude);
        statement.BindInt64(6, record.Time);
        statement.BindInt64(7, record.Updated);
        statement.BindText(8, record.Place);
        statement.BindText(9, record.Url);
        statement.BindText(10, record.Alert);
        statement.BindInt(11, record.Tsunami);
        statement.BindInt(12, record.Significance);
        statement.BindInt64(13, record.SyncedAt);
    }

    private static bool AreEquivalent(ExistingEarthquakeRecord existing, EarthquakeRecord record)
    {
        return NearlyEquals(existing.Longitude, record.Longitude) &&
               NearlyEquals(existing.Latitude, record.Latitude) &&
               NearlyEquals(existing.Depth, record.Depth) &&
               NearlyEquals(existing.Magnitude, record.Magnitude) &&
               existing.Time == record.Time &&
               existing.Updated == record.Updated &&
               string.Equals(existing.Place, record.Place, StringComparison.Ordinal) &&
               string.Equals(existing.Url, record.Url, StringComparison.Ordinal) &&
               string.Equals(existing.Alert, record.Alert, StringComparison.Ordinal) &&
               existing.Tsunami == record.Tsunami &&
               existing.Significance == record.Significance;
    }

    private static bool NearlyEquals(double left, double right) => Math.Abs(left - right) < 0.0000001;

    private void RegisterSyncRunCore(SyncRunRecord run)
    {
        using var statement = SqliteNative.Prepare(
            _connection,
            """
            INSERT INTO sync_runs (
                run_id,
                requested_start_time,
                requested_end_time,
                start_time,
                end_time,
                min_magnitude,
                fetched_count,
                inserted_count,
                updated_count,
                skipped_count,
                stored_count,
                total_chunks,
                chunk_index,
                status,
                is_full_sync,
                is_incremental,
                started_at,
                completed_at,
                failed_at,
                error_message
            )
            VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20
            );
            """);

        statement.BindText(1, run.RunId);
        statement.BindInt64(2, run.RequestedStartTime);
        statement.BindInt64(3, run.RequestedEndTime);
        statement.BindInt64(4, run.StartTime);
        statement.BindInt64(5, run.EndTime);
        statement.BindDouble(6, run.MinMagnitude);
        statement.BindInt(7, run.FetchedCount);
        statement.BindInt(8, run.InsertedCount);
        statement.BindInt(9, run.UpdatedCount);
        statement.BindInt(10, run.SkippedCount);
        statement.BindInt64(11, run.StoredCount);
        statement.BindInt(12, run.TotalChunks);
        statement.BindInt(13, run.ChunkIndex);
        statement.BindText(14, run.Status);
        statement.BindInt(15, run.IsFullSync ? 1 : 0);
        statement.BindInt(16, run.IsIncremental ? 1 : 0);
        statement.BindInt64(17, run.StartedAt);
        statement.BindInt64(18, run.CompletedAt);
        statement.BindInt64(19, run.FailedAt);
        statement.BindText(20, run.ErrorMessage ?? string.Empty);
        statement.StepDone();
    }

    private SyncCoverageState GetCoverageStateCore(long coverageStartTime, double minMagnitude)
    {
        using var statement = SqliteNative.Prepare(
            _connection,
            """
            SELECT start_time, end_time
            FROM sync_runs
            WHERE status = 'completed'
              AND min_magnitude <= ?1
              AND end_time >= ?2
            ORDER BY start_time ASC, end_time ASC;
            """);
        statement.BindDouble(1, minMagnitude);
        statement.BindInt64(2, coverageStartTime);

        var coverageEnd = coverageStartTime - 1;
        var hasCoverage = false;

        while (statement.StepRow())
        {
            var startTime = statement.GetInt64(0);
            var endTime = statement.GetInt64(1);

            if (!hasCoverage)
            {
                if (startTime > coverageStartTime)
                {
                    break;
                }

                hasCoverage = endTime >= coverageStartTime;
                if (!hasCoverage)
                {
                    continue;
                }

                coverageEnd = Math.Max(coverageStartTime, endTime);
                continue;
            }

            if (startTime > coverageEnd + 1)
            {
                break;
            }

            if (endTime > coverageEnd)
            {
                coverageEnd = endTime;
            }
        }

        return new SyncCoverageState(
            CoverageStartTime: coverageStartTime,
            CoveredEndTime: hasCoverage ? coverageEnd : coverageStartTime - 1,
            HasCoverage: hasCoverage);
    }

    private void EnsureSyncRunSchema()
    {
        EnsureColumn("sync_runs", "run_id", "TEXT NOT NULL DEFAULT ''");
        EnsureColumn("sync_runs", "requested_start_time", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "requested_end_time", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "inserted_count", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "updated_count", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "skipped_count", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "stored_count", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "total_chunks", "INTEGER NOT NULL DEFAULT 1");
        EnsureColumn("sync_runs", "chunk_index", "INTEGER NOT NULL DEFAULT 1");
        EnsureColumn("sync_runs", "status", "TEXT NOT NULL DEFAULT 'completed'");
        EnsureColumn("sync_runs", "is_full_sync", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "is_incremental", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "started_at", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "failed_at", "INTEGER NOT NULL DEFAULT 0");
        EnsureColumn("sync_runs", "error_message", "TEXT NOT NULL DEFAULT ''");

        SqliteNative.Execute(
            _connection,
            """
            CREATE INDEX IF NOT EXISTS idx_sync_runs_coverage
                ON sync_runs(status, start_time, end_time, min_magnitude);

            CREATE INDEX IF NOT EXISTS idx_sync_runs_completed
                ON sync_runs(status, completed_at DESC, end_time DESC);
            """);
    }

    private void EnsureColumn(string tableName, string columnName, string columnDefinition)
    {
        if (ColumnExists(tableName, columnName))
        {
            return;
        }

        SqliteNative.Execute(
            _connection,
            $"ALTER TABLE {tableName} ADD COLUMN {columnName} {columnDefinition};");
    }

    private bool ColumnExists(string tableName, string columnName)
    {
        using var statement = SqliteNative.Prepare(
            _connection,
            $"PRAGMA table_info({tableName});");

        while (statement.StepRow())
        {
            if (string.Equals(statement.GetString(1), columnName, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private void EnsureSyncRunDefaults()
    {
        var catalogStart = new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero)
            .ToUnixTimeMilliseconds();
        var minMagnitude = ProjectMinMagnitude.ToString(CultureInfo.InvariantCulture);

        SqliteNative.Execute(
            _connection,
            $"""
            UPDATE sync_runs
            SET run_id = CASE
                    WHEN trim(run_id) = '' THEN printf('legacy-%lld-%lld-%lld', start_time, end_time, completed_at)
                    ELSE run_id
                END,
                requested_start_time = CASE
                    WHEN requested_start_time = 0 THEN start_time
                    ELSE requested_start_time
                END,
                requested_end_time = CASE
                    WHEN requested_end_time = 0 THEN end_time
                    ELSE requested_end_time
                END,
                inserted_count = COALESCE(inserted_count, 0),
                updated_count = COALESCE(updated_count, 0),
                skipped_count = COALESCE(skipped_count, 0),
                stored_count = COALESCE(stored_count, 0),
                total_chunks = CASE
                    WHEN total_chunks <= 0 THEN 1
                    ELSE total_chunks
                END,
                chunk_index = CASE
                    WHEN chunk_index <= 0 THEN 1
                    ELSE chunk_index
                END,
                status = CASE
                    WHEN trim(status) = '' THEN 'completed'
                    ELSE status
                END,
                is_full_sync = CASE
                    WHEN is_full_sync = 0 AND is_incremental = 0
                        THEN CASE WHEN start_time <= {catalogStart} THEN 1 ELSE 0 END
                    ELSE is_full_sync
                END,
                is_incremental = CASE
                    WHEN is_full_sync = 0 AND is_incremental = 0
                        THEN CASE WHEN start_time > {catalogStart} THEN 1 ELSE 0 END
                    ELSE is_incremental
                END,
                started_at = CASE
                    WHEN started_at = 0 THEN completed_at
                    ELSE started_at
                END,
                completed_at = COALESCE(completed_at, 0),
                failed_at = COALESCE(failed_at, 0),
                error_message = COALESCE(error_message, '')
            WHERE min_magnitude >= {minMagnitude};
            """);
    }

    private async Task MigrateLegacyFilesAsync(CancellationToken cancellationToken)
    {
        if (File.Exists(LegacyStorePath) && ExecuteScalarLong("SELECT COUNT(*) FROM earthquakes;") == 0)
        {
            var records = await ReadLegacyRecordsAsync(cancellationToken);
            if (records.Count > 0)
            {
                UpsertBatchCore(records, cancellationToken);
            }
        }

        if (File.Exists(LegacySyncRunPath) && ExecuteScalarLong("SELECT COUNT(*) FROM sync_runs;") == 0)
        {
            var syncRuns = await ReadLegacySyncRunsAsync(cancellationToken);
            foreach (var run in syncRuns)
            {
                cancellationToken.ThrowIfCancellationRequested();
                RegisterSyncRunCore(run);
            }
        }
    }

    private async Task<IReadOnlyList<EarthquakeRecord>> ReadLegacyRecordsAsync(
        CancellationToken cancellationToken)
    {
        var records = new List<EarthquakeRecord>();
        await using var stream = new FileStream(
            LegacyStorePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.ReadWrite);
        using var reader = new StreamReader(stream);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is null)
            {
                break;
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var record = JsonSerializer.Deserialize<EarthquakeRecord>(line, SerializerOptions);
            if (record is not null && record.Magnitude >= ProjectMinMagnitude)
            {
                records.Add(record);
            }
        }

        return records;
    }

    private async Task<IReadOnlyList<SyncRunRecord>> ReadLegacySyncRunsAsync(
        CancellationToken cancellationToken)
    {
        var runs = new List<SyncRunRecord>();
        await using var stream = new FileStream(
            LegacySyncRunPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.ReadWrite);
        using var reader = new StreamReader(stream);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is null)
            {
                break;
            }

            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var run = JsonSerializer.Deserialize<LegacySyncRunRecord>(line, SerializerOptions);
            if (run is null)
            {
                continue;
            }

            runs.Add(new SyncRunRecord(
                RunId: $"legacy-{run.StartTime}-{run.EndTime}-{run.CompletedAt}",
                RequestedStartTime: run.StartTime,
                RequestedEndTime: run.EndTime,
                StartTime: run.StartTime,
                EndTime: run.EndTime,
                MinMagnitude: NormalizeMinMagnitude(run.MinMagnitude),
                FetchedCount: run.FetchedCount,
                InsertedCount: 0,
                UpdatedCount: run.FetchedCount,
                SkippedCount: 0,
                StoredCount: 0,
                TotalChunks: 1,
                ChunkIndex: 1,
                Status: "completed",
                IsFullSync: run.StartTime <= new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds(),
                IsIncremental: run.StartTime > new DateTimeOffset(1949, 1, 1, 0, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds(),
                StartedAt: run.CompletedAt,
                CompletedAt: run.CompletedAt,
                FailedAt: 0,
                ErrorMessage: string.Empty));
        }

        return runs;
    }
}

internal sealed record EarthquakeQuery(
    long StartTime,
    long EndTime,
    double MinMagnitude,
    int? Limit = null,
    int Offset = 0);

internal sealed record EarthquakeRecord(
    string Id,
    double Longitude,
    double Latitude,
    double Depth,
    double Magnitude,
    long Time,
    long Updated,
    string Place,
    string Url,
    string Alert,
    int Tsunami,
    int Significance,
    long SyncedAt);

internal sealed record UpsertBatchResult(
    int FetchedCount,
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount)
{
    public static UpsertBatchResult Empty => new(0, 0, 0, 0);
}

internal sealed record SyncCoverageState(
    long CoverageStartTime,
    long CoveredEndTime,
    bool HasCoverage);

internal sealed record SyncRunRecord(
    string RunId,
    long RequestedStartTime,
    long RequestedEndTime,
    long StartTime,
    long EndTime,
    double MinMagnitude,
    int FetchedCount,
    int InsertedCount,
    int UpdatedCount,
    int SkippedCount,
    long StoredCount,
    int TotalChunks,
    int ChunkIndex,
    string Status,
    bool IsFullSync,
    bool IsIncremental,
    long StartedAt,
    long CompletedAt,
    long FailedAt,
    string? ErrorMessage);

internal sealed record LegacySyncRunRecord(
    long StartTime,
    long EndTime,
    double MinMagnitude,
    int FetchedCount,
    long CompletedAt);

internal sealed record ExistingEarthquakeRecord(
    double Longitude,
    double Latitude,
    double Depth,
    double Magnitude,
    long Time,
    long Updated,
    string Place,
    string Url,
    string Alert,
    int Tsunami,
    int Significance);
