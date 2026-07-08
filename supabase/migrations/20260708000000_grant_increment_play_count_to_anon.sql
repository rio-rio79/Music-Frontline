DO $$
DECLARE
    v_function record;
BEGIN
    FOR v_function IN
        SELECT pg_catalog.pg_get_function_identity_arguments(pg_proc.oid) AS arguments
        FROM pg_catalog.pg_proc
        JOIN pg_catalog.pg_namespace
            ON pg_namespace.oid = pg_proc.pronamespace
        WHERE pg_namespace.nspname = 'public'
          AND pg_proc.proname = 'increment_play_count'
    LOOP
        EXECUTE pg_catalog.format(
            'GRANT EXECUTE ON FUNCTION public.increment_play_count(%s) TO anon, authenticated',
            v_function.arguments
        );
    END LOOP;
END;
$$;
