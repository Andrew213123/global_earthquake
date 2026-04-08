using System.Runtime.InteropServices;

namespace LocalQuakeServer;

internal static class SqliteNative
{
    internal const int Ok = 0;
    internal const int Row = 100;
    internal const int Done = 101;
    private const int OpenReadWrite = 0x00000002;
    private const int OpenCreate = 0x00000004;
    private const int OpenFullMutex = 0x00010000;
    private static readonly IntPtr Transient = new(-1);

    internal static IntPtr Open(string databasePath)
    {
        var rc = sqlite3_open_v2(
            databasePath,
            out var db,
            OpenReadWrite | OpenCreate | OpenFullMutex,
            IntPtr.Zero);

        if (rc != Ok || db == IntPtr.Zero)
        {
            throw BuildException(db, rc, $"Failed to open SQLite database {databasePath}.");
        }

        ThrowIfError(
            sqlite3_busy_timeout(db, 30_000),
            db,
            "Failed to configure SQLite busy timeout.");

        return db;
    }

    internal static void Close(IntPtr db)
    {
        if (db != IntPtr.Zero)
        {
            sqlite3_close_v2(db);
        }
    }

    internal static void Execute(IntPtr db, string sql)
    {
        var rc = sqlite3_exec(db, sql, IntPtr.Zero, IntPtr.Zero, out var errorPointer);
        try
        {
            if (rc != Ok)
            {
                var detail = errorPointer == IntPtr.Zero
                    ? GetErrorMessage(db)
                    : Marshal.PtrToStringUTF8(errorPointer) ?? GetErrorMessage(db);
                throw new InvalidOperationException($"{detail} SQL: {sql}");
            }
        }
        finally
        {
            if (errorPointer != IntPtr.Zero)
            {
                sqlite3_free(errorPointer);
            }
        }
    }

    internal static SqliteStatement Prepare(IntPtr db, string sql) => new(db, sql);

    internal static void ThrowIfError(int rc, IntPtr db, string action)
    {
        if (rc != Ok)
        {
            throw BuildException(db, rc, action);
        }
    }

    private static Exception BuildException(IntPtr db, int rc, string action)
        => new InvalidOperationException($"{action} {GetErrorMessage(db)} (code {rc}).");

    private static string GetErrorMessage(IntPtr db)
    {
        if (db == IntPtr.Zero)
        {
            return "SQLite connection handle is null.";
        }

        var pointer = sqlite3_errmsg(db);
        return Marshal.PtrToStringUTF8(pointer) ?? "Unknown SQLite error.";
    }

    internal sealed class SqliteStatement : IDisposable
    {
        private readonly IntPtr _db;
        private readonly string _sql;
        private IntPtr _statement;

        public SqliteStatement(IntPtr db, string sql)
        {
            _db = db;
            _sql = sql;
            ThrowIfError(
                sqlite3_prepare_v2(db, sql, -1, out _statement, IntPtr.Zero),
                db,
                "Failed to prepare SQLite statement.");
        }

        public void BindText(int index, string? value)
        {
            if (value is null)
            {
                ThrowIfError(sqlite3_bind_null(_statement, index), _db, "Failed to bind NULL text.");
                return;
            }

            ThrowIfError(
                sqlite3_bind_text(_statement, index, value, -1, Transient),
                _db,
                "Failed to bind text value.");
        }

        public void BindDouble(int index, double value)
            => ThrowIfError(
                sqlite3_bind_double(_statement, index, value),
                _db,
                "Failed to bind double value.");

        public void BindInt(int index, int value)
            => ThrowIfError(
                sqlite3_bind_int(_statement, index, value),
                _db,
                "Failed to bind integer value.");

        public void BindInt64(int index, long value)
            => ThrowIfError(
                sqlite3_bind_int64(_statement, index, value),
                _db,
                "Failed to bind integer64 value.");

        public bool StepRow()
        {
            var rc = sqlite3_step(_statement);
            return rc switch
            {
                Row => true,
                Done => false,
                _ => throw BuildException(_db, rc, $"Failed to step SQLite statement: {_sql}")
            };
        }

        public void StepDone()
        {
            var rc = sqlite3_step(_statement);
            if (rc != Done)
            {
                throw BuildException(_db, rc, $"Failed to execute SQLite statement: {_sql}");
            }
        }

        public void Reset()
        {
            ThrowIfError(
                sqlite3_reset(_statement),
                _db,
                "Failed to reset SQLite statement.");
            ThrowIfError(
                sqlite3_clear_bindings(_statement),
                _db,
                "Failed to clear SQLite bindings.");
        }

        public string GetString(int index)
        {
            var pointer = sqlite3_column_text(_statement, index);
            return pointer == IntPtr.Zero
                ? string.Empty
                : Marshal.PtrToStringUTF8(pointer) ?? string.Empty;
        }

        public double GetDouble(int index) => sqlite3_column_double(_statement, index);

        public int GetInt(int index) => sqlite3_column_int(_statement, index);

        public long GetInt64(int index) => sqlite3_column_int64(_statement, index);

        public void Dispose()
        {
            if (_statement != IntPtr.Zero)
            {
                sqlite3_finalize(_statement);
                _statement = IntPtr.Zero;
            }
        }
    }

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_open_v2(
        [MarshalAs(UnmanagedType.LPUTF8Str)] string filename,
        out IntPtr db,
        int flags,
        IntPtr zvfs);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_close_v2(IntPtr db);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr sqlite3_errmsg(IntPtr db);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_exec(
        IntPtr db,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string sql,
        IntPtr callback,
        IntPtr arg,
        out IntPtr errorMessage);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern void sqlite3_free(IntPtr pointer);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_prepare_v2(
        IntPtr db,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string sql,
        int byteCount,
        out IntPtr statement,
        IntPtr tail);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_step(IntPtr statement);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_finalize(IntPtr statement);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_reset(IntPtr statement);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_clear_bindings(IntPtr statement);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_bind_text(
        IntPtr statement,
        int index,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string value,
        int byteCount,
        IntPtr destructor);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_bind_double(IntPtr statement, int index, double value);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_bind_int(IntPtr statement, int index, int value);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_bind_int64(IntPtr statement, int index, long value);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_bind_null(IntPtr statement, int index);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr sqlite3_column_text(IntPtr statement, int index);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern double sqlite3_column_double(IntPtr statement, int index);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_column_int(IntPtr statement, int index);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern long sqlite3_column_int64(IntPtr statement, int index);

    [DllImport("winsqlite3", CallingConvention = CallingConvention.Cdecl)]
    private static extern int sqlite3_busy_timeout(IntPtr db, int milliseconds);
}
