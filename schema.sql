


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cap_note_versions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  delete from note_versions
  where id in (
    select id from note_versions
    where note_id = new.note_id
    order by created_at desc
    offset 50
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."cap_note_versions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.user_integrations (user_id) values (new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_old_trash"() RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  deleted_count integer;
begin
  delete from notes
  where deleted_at is not null
    and deleted_at < now() - interval '30 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;


ALTER FUNCTION "public"."purge_old_trash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_notes_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."note_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "note_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "trigger_source" "text" DEFAULT 'auto'::"text" NOT NULL
);


ALTER TABLE "public"."note_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'Untitled'::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "asana_client_id" "text",
    "asana_client_secret" "text",
    "asana_access_token" "text",
    "asana_refresh_token" "text",
    "asana_expires_at" bigint,
    "ms365_access_token" "text",
    "ms365_refresh_token" "text",
    "ms365_expires_at" bigint,
    "ms365_user" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "asana_state" "text",
    "asana_code_verifier" "text",
    "ms365_state" "text",
    "ms365_code_verifier" "text",
    "asana_workspace_gid" "text"
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."note_versions"
    ADD CONSTRAINT "note_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_note_versions_note" ON "public"."note_versions" USING "btree" ("note_id", "created_at" DESC);



CREATE INDEX "idx_notes_user_list" ON "public"."notes" USING "btree" ("user_id", "deleted_at", "updated_at" DESC);



CREATE INDEX "idx_notes_user_pinned" ON "public"."notes" USING "btree" ("user_id", "is_pinned", "updated_at" DESC);



CREATE OR REPLACE TRIGGER "note_versions_cap" AFTER INSERT ON "public"."note_versions" FOR EACH ROW EXECUTE FUNCTION "public"."cap_note_versions"();



CREATE OR REPLACE TRIGGER "notes_updated_at" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_notes_updated_at"();



ALTER TABLE ONLY "public"."note_versions"
    ADD CONSTRAINT "note_versions_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_versions"
    ADD CONSTRAINT "note_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete own integrations" ON "public"."user_integrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own integrations" ON "public"."user_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own integrations" ON "public"."user_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own integrations" ON "public"."user_integrations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."note_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes_delete_own" ON "public"."notes" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notes_insert_own" ON "public"."notes" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notes_select_own" ON "public"."notes" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notes_update_own" ON "public"."notes" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "versions_delete_own" ON "public"."note_versions" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "versions_insert_own" ON "public"."note_versions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "versions_select_own" ON "public"."note_versions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."cap_note_versions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cap_note_versions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cap_note_versions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purge_old_trash"() TO "anon";
GRANT ALL ON FUNCTION "public"."purge_old_trash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_old_trash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notes_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."note_versions" TO "anon";
GRANT ALL ON TABLE "public"."note_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."note_versions" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































