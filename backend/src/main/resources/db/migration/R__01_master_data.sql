-- ====================================================================
-- Repeatable Migration: R__01_master_data.sql
-- Master data is maintained via versioned migrations (V1-V10) and initData.sql.
-- Obsolete duplicate inserts have been removed to prevent duplicate key
-- and non-unique result exceptions in Spring Boot JPA repositories.
-- ====================================================================
SELECT 1;
