REVOKE USAGE ON SCHEMA private FROM anon;
REVOKE USAGE ON SCHEMA private FROM authenticated;
REVOKE USAGE ON SCHEMA private FROM public;

REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM public;

GRANT USAGE ON SCHEMA private TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;
