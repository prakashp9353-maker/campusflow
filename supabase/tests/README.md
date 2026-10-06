Local verification of the migrations against plain Postgres (not for Supabase itself):

    createdb cftest
    psql cftest -f supabase/tests/00_auth_stub.sql   # stubs Supabase's auth schema and roles
    psql cftest -f supabase/migrations/0001_schema.sql -f supabase/migrations/0002_initial_config.sql
    psql cftest -f supabase/tests/01_behavior.sql    # prints "ok - ..." per check, errors on failure
