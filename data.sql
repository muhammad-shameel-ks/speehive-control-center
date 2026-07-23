SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict Ld9UGyW0DEmztoSkvWZBu4q6Ar8odex2U5elCI3coqavw2SSM43jkq0JRsZiaks

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at", "custom_claims_allowlist") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	af0482ec-3a1c-42b2-8a73-fa499068ff10	authenticated	authenticated	test@test.com	$2a$10$i6yxp8pVWSBGboelxegDLOZ.A0j.QrPQMkSh/nOFCL9fHtYzfxxnm	2026-07-10 07:15:57.45658+00	\N		\N		\N			\N	2026-07-10 07:15:57.46291+00	{"provider": "email", "providers": ["email"]}	{"sub": "af0482ec-3a1c-42b2-8a73-fa499068ff10", "email": "test@test.com", "email_verified": true, "phone_verified": false}	\N	2026-07-10 07:15:57.419241+00	2026-07-10 07:15:57.48343+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	474ddf05-3384-4f9f-923a-20d3b9bdfb8b	authenticated	authenticated	abu@mail.com	$2a$10$w5EoXLiwryoGZIj02Sbt8e3gFGYk.N8wvJV9YqC.Msb6qtX61iLd2	2026-07-10 07:22:46.983012+00	\N		\N		\N			\N	2026-07-10 07:22:50.054789+00	{"provider": "email", "providers": ["email"]}	{"sub": "474ddf05-3384-4f9f-923a-20d3b9bdfb8b", "email": "abu@mail.com", "email_verified": true, "phone_verified": false}	\N	2026-07-10 07:22:46.963557+00	2026-07-10 07:22:50.05734+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9ad7d34a-4b37-474b-942d-b301512da44c	authenticated	authenticated	shameel@mail.com	$2a$10$bRH.yx6n6j42Efm3ILA9i..Kz1h2QCHom3xKzFugFJF0w7mId20ye	2026-07-10 07:17:19.417031+00	\N		\N		\N			\N	2026-07-22 09:33:21.056893+00	{"provider": "email", "providers": ["email"]}	{"sub": "9ad7d34a-4b37-474b-942d-b301512da44c", "email": "shameel@mail.com", "email_verified": true, "phone_verified": false}	\N	2026-07-10 07:17:19.389262+00	2026-07-22 09:33:21.10945+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d9092b84-f6ec-42cd-821d-7eff0ae04c3e	authenticated	authenticated	raeed@mail.com	$2a$10$Wnr8HXtUesqoBCybKFfDp.Hv3NG7Eum1lpgfhrmePauT89SrioV.O	2026-07-10 07:23:48.697587+00	\N		\N		\N			\N	2026-07-16 08:22:16.846966+00	{"provider": "email", "providers": ["email"]}	{"sub": "d9092b84-f6ec-42cd-821d-7eff0ae04c3e", "email": "raeed@mail.com", "email_verified": true, "phone_verified": false}	\N	2026-07-10 07:23:48.690107+00	2026-07-16 08:22:16.866208+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	2cdc80f8-888f-4aff-8508-2f63b544546f	authenticated	authenticated	mohamed.afran@speehive.com	$2a$10$BcDlUDx3thCia4h31IbzCOJ8Nhqgp2i8hlmGASVHut.Y7dFyk2sV2	2026-07-10 08:12:56.232257+00	\N		\N		\N			\N	2026-07-10 08:12:56.23776+00	{"provider": "email", "providers": ["email"]}	{"sub": "2cdc80f8-888f-4aff-8508-2f63b544546f", "email": "mohamed.afran@speehive.com", "email_verified": true, "phone_verified": false}	\N	2026-07-10 08:12:56.182866+00	2026-07-16 09:52:52.175328+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	e4c3dca9-5e96-4bf8-8138-6481ce64910f	authenticated	authenticated	sanil.davis@speehive.com	$2a$10$/A5sE6nf4BgrLuCXnKAceOl5AV/sCK1RyXev1mZscY/5VJbv8iuvu	2026-07-10 09:24:33.369345+00	\N		\N		\N			\N	2026-07-10 09:24:33.375077+00	{"provider": "email", "providers": ["email"]}	{"sub": "e4c3dca9-5e96-4bf8-8138-6481ce64910f", "email": "sanil.davis@speehive.com", "email_verified": true, "phone_verified": false}	\N	2026-07-10 09:24:33.346318+00	2026-07-10 12:29:01.836691+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	38458bae-b6a3-4f51-b27b-9d85bc5fc7e2	authenticated	authenticated	arsh123@gmail.om	$2a$10$6Q43LQN06ph8bYf9iu/ScesZNC3O5b7zLw47i91UJ6ET5IyxRggYO	2026-07-21 20:52:41.775906+00	\N		\N		\N			\N	2026-07-21 20:52:41.786049+00	{"provider": "email", "providers": ["email"]}	{"sub": "38458bae-b6a3-4f51-b27b-9d85bc5fc7e2", "email": "arsh123@gmail.om", "email_verified": true, "phone_verified": false}	\N	2026-07-21 20:52:41.674976+00	2026-07-21 20:52:41.827926+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
af0482ec-3a1c-42b2-8a73-fa499068ff10	af0482ec-3a1c-42b2-8a73-fa499068ff10	{"sub": "af0482ec-3a1c-42b2-8a73-fa499068ff10", "email": "test@test.com", "email_verified": false, "phone_verified": false}	email	2026-07-10 07:15:57.446541+00	2026-07-10 07:15:57.446618+00	2026-07-10 07:15:57.446618+00	7d202491-3580-4671-8be0-8d5fe50eec35
9ad7d34a-4b37-474b-942d-b301512da44c	9ad7d34a-4b37-474b-942d-b301512da44c	{"sub": "9ad7d34a-4b37-474b-942d-b301512da44c", "email": "shameel@mail.com", "email_verified": false, "phone_verified": false}	email	2026-07-10 07:17:19.411544+00	2026-07-10 07:17:19.411607+00	2026-07-10 07:17:19.411607+00	1856c58e-403e-4f0f-ad89-b1159c1cf43c
474ddf05-3384-4f9f-923a-20d3b9bdfb8b	474ddf05-3384-4f9f-923a-20d3b9bdfb8b	{"sub": "474ddf05-3384-4f9f-923a-20d3b9bdfb8b", "email": "abu@mail.com", "email_verified": false, "phone_verified": false}	email	2026-07-10 07:22:46.978453+00	2026-07-10 07:22:46.978506+00	2026-07-10 07:22:46.978506+00	9cea14f8-3528-41a7-a332-283c97423c93
d9092b84-f6ec-42cd-821d-7eff0ae04c3e	d9092b84-f6ec-42cd-821d-7eff0ae04c3e	{"sub": "d9092b84-f6ec-42cd-821d-7eff0ae04c3e", "email": "raeed@mail.com", "email_verified": false, "phone_verified": false}	email	2026-07-10 07:23:48.694674+00	2026-07-10 07:23:48.69472+00	2026-07-10 07:23:48.69472+00	aefddea5-dda9-472c-bbbb-af6682faaa05
2cdc80f8-888f-4aff-8508-2f63b544546f	2cdc80f8-888f-4aff-8508-2f63b544546f	{"sub": "2cdc80f8-888f-4aff-8508-2f63b544546f", "email": "mohamed.afran@speehive.com", "email_verified": false, "phone_verified": false}	email	2026-07-10 08:12:56.221124+00	2026-07-10 08:12:56.221181+00	2026-07-10 08:12:56.221181+00	f2db3367-7819-442e-8405-4e5180b0790f
e4c3dca9-5e96-4bf8-8138-6481ce64910f	e4c3dca9-5e96-4bf8-8138-6481ce64910f	{"sub": "e4c3dca9-5e96-4bf8-8138-6481ce64910f", "email": "sanil.davis@speehive.com", "email_verified": false, "phone_verified": false}	email	2026-07-10 09:24:33.364303+00	2026-07-10 09:24:33.364355+00	2026-07-10 09:24:33.364355+00	ac18eade-6202-4432-9146-a8ab05e0f9e6
38458bae-b6a3-4f51-b27b-9d85bc5fc7e2	38458bae-b6a3-4f51-b27b-9d85bc5fc7e2	{"sub": "38458bae-b6a3-4f51-b27b-9d85bc5fc7e2", "email": "arsh123@gmail.om", "email_verified": false, "phone_verified": false}	email	2026-07-21 20:52:41.761245+00	2026-07-21 20:52:41.761935+00	2026-07-21 20:52:41.761935+00	78de2f41-6900-4b0d-a102-9538aef61094
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
62e745f3-bcb3-430a-bd44-fb6c7d0253c3	af0482ec-3a1c-42b2-8a73-fa499068ff10	2026-07-10 07:15:57.46304+00	2026-07-10 07:15:57.46304+00	\N	aal1	\N	\N	curl/8.18.0	115.245.158.38	\N	\N	\N	\N	\N
c5ec7ba6-4b9b-4b37-bca3-df23da516db1	e4c3dca9-5e96-4bf8-8138-6481ce64910f	2026-07-10 09:24:33.375166+00	2026-07-10 12:29:01.847535+00	\N	aal1	\N	2026-07-10 12:29:01.847421	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	111.92.109.102	\N	\N	\N	\N	\N
0a718cf9-75e9-45f7-8fe6-0371f2ee4d75	d9092b84-f6ec-42cd-821d-7eff0ae04c3e	2026-07-16 08:22:16.847937+00	2026-07-16 08:22:16.847937+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	111.92.109.102	\N	\N	\N	\N	\N
432ff2d9-529b-4939-939b-beae2c433c56	2cdc80f8-888f-4aff-8508-2f63b544546f	2026-07-10 08:12:56.237869+00	2026-07-16 09:52:52.190374+00	\N	aal1	\N	2026-07-16 09:52:52.190257	node	13.232.36.228	\N	\N	\N	\N	\N
5a498dc1-a279-42fe-a99e-f40ee3f0dd04	9ad7d34a-4b37-474b-942d-b301512da44c	2026-07-21 04:55:13.967171+00	2026-07-21 12:08:26.183131+00	\N	aal1	\N	2026-07-21 12:08:26.183028	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	111.92.109.102	\N	\N	\N	\N	\N
6a0f9c9b-4d8c-405e-a9c3-a6f0a28934f5	9ad7d34a-4b37-474b-942d-b301512da44c	2026-07-22 09:33:21.05781+00	2026-07-22 09:33:21.05781+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	111.92.109.102	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
62e745f3-bcb3-430a-bd44-fb6c7d0253c3	2026-07-10 07:15:57.484079+00	2026-07-10 07:15:57.484079+00	password	f9989c8d-2030-4528-9115-65db585e0a65
432ff2d9-529b-4939-939b-beae2c433c56	2026-07-10 08:12:56.242283+00	2026-07-10 08:12:56.242283+00	password	46ccadb8-511d-4174-90df-0398742f7556
c5ec7ba6-4b9b-4b37-bca3-df23da516db1	2026-07-10 09:24:33.377548+00	2026-07-10 09:24:33.377548+00	password	5c548dc5-7570-4710-976a-a4010c78b537
0a718cf9-75e9-45f7-8fe6-0371f2ee4d75	2026-07-16 08:22:16.869492+00	2026-07-16 08:22:16.869492+00	password	8275887f-a834-4da4-9c66-cb12ac986a2d
5a498dc1-a279-42fe-a99e-f40ee3f0dd04	2026-07-21 04:55:13.997913+00	2026-07-21 04:55:13.997913+00	password	90dacfc9-fe85-4d0a-b863-d5d0764ff10c
6a0f9c9b-4d8c-405e-a9c3-a6f0a28934f5	2026-07-22 09:33:21.120361+00	2026-07-22 09:33:21.120361+00	password	83ab45dc-a2f5-4829-86c0-ca3a2ae86ef3
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	1	hya4lnjjqee4	af0482ec-3a1c-42b2-8a73-fa499068ff10	f	2026-07-10 07:15:57.470406+00	2026-07-10 07:15:57.470406+00	\N	62e745f3-bcb3-430a-bd44-fb6c7d0253c3
00000000-0000-0000-0000-000000000000	47	4aommchlas5u	9ad7d34a-4b37-474b-942d-b301512da44c	f	2026-07-22 09:33:21.091373+00	2026-07-22 09:33:21.091373+00	\N	6a0f9c9b-4d8c-405e-a9c3-a6f0a28934f5
00000000-0000-0000-0000-000000000000	25	pc5tptqngsin	e4c3dca9-5e96-4bf8-8138-6481ce64910f	t	2026-07-10 09:24:33.376113+00	2026-07-10 10:42:03.016499+00	\N	c5ec7ba6-4b9b-4b37-bca3-df23da516db1
00000000-0000-0000-0000-000000000000	27	2lorlcwzti3f	e4c3dca9-5e96-4bf8-8138-6481ce64910f	t	2026-07-10 10:42:03.023208+00	2026-07-10 12:29:01.814193+00	pc5tptqngsin	c5ec7ba6-4b9b-4b37-bca3-df23da516db1
00000000-0000-0000-0000-000000000000	28	2woususju3l3	e4c3dca9-5e96-4bf8-8138-6481ce64910f	f	2026-07-10 12:29:01.827952+00	2026-07-10 12:29:01.827952+00	2lorlcwzti3f	c5ec7ba6-4b9b-4b37-bca3-df23da516db1
00000000-0000-0000-0000-000000000000	32	chmdgdeuz5y3	d9092b84-f6ec-42cd-821d-7eff0ae04c3e	f	2026-07-16 08:22:16.862199+00	2026-07-16 08:22:16.862199+00	\N	0a718cf9-75e9-45f7-8fe6-0371f2ee4d75
00000000-0000-0000-0000-000000000000	21	ei76nw2kk5xc	2cdc80f8-888f-4aff-8508-2f63b544546f	t	2026-07-10 08:12:56.23942+00	2026-07-16 09:52:52.143215+00	\N	432ff2d9-529b-4939-939b-beae2c433c56
00000000-0000-0000-0000-000000000000	34	jvq535ml3nz6	2cdc80f8-888f-4aff-8508-2f63b544546f	f	2026-07-16 09:52:52.164609+00	2026-07-16 09:52:52.164609+00	ei76nw2kk5xc	432ff2d9-529b-4939-939b-beae2c433c56
00000000-0000-0000-0000-000000000000	44	3cykmzxb2qzm	9ad7d34a-4b37-474b-942d-b301512da44c	t	2026-07-21 04:55:13.986522+00	2026-07-21 12:08:26.142396+00	\N	5a498dc1-a279-42fe-a99e-f40ee3f0dd04
00000000-0000-0000-0000-000000000000	45	wds7pecpxddn	9ad7d34a-4b37-474b-942d-b301512da44c	f	2026-07-21 12:08:26.15985+00	2026-07-21 12:08:26.15985+00	3cykmzxb2qzm	5a498dc1-a279-42fe-a99e-f40ee3f0dd04
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."notes" ("id", "user_id", "title", "content", "is_pinned", "created_at", "updated_at", "deleted_at") FROM stdin;
8cd581f2-13dc-4a41-972a-a1ec626f72a3	2cdc80f8-888f-4aff-8508-2f63b544546f		Get money	f	2026-07-16 09:53:44.642452+00	2026-07-16 09:53:44.642452+00	\N
c52ae1ea-3a88-4c30-8238-38da7d2d6fb9	9ad7d34a-4b37-474b-942d-b301512da44c		IM testing everything	f	2026-07-22 09:33:52.293026+00	2026-07-22 09:33:52.293026+00	\N
\.


--
-- Data for Name: note_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."note_versions" ("id", "note_id", "user_id", "title", "content", "created_at", "trigger_source") FROM stdin;
\.


--
-- Data for Name: user_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_integrations" ("id", "user_id", "asana_client_id", "asana_client_secret", "asana_access_token", "asana_refresh_token", "asana_expires_at", "ms365_access_token", "ms365_refresh_token", "ms365_expires_at", "ms365_user", "updated_at", "asana_state", "asana_code_verifier", "ms365_state", "ms365_code_verifier", "asana_workspace_gid") FROM stdin;
36db4534-f34a-4edc-99a2-ebc010f74720	af0482ec-3a1c-42b2-8a73-fa499068ff10	1216717826097403	6e8ab446b934823ce69fee8ce85373f0	\N	\N	\N	\N	\N	\N	\N	2026-07-10 07:15:57.417973+00	\N	\N	\N	\N	\N
941792ff-581b-4cbc-bfcd-68da422466d7	9ad7d34a-4b37-474b-942d-b301512da44c	1216717826097403	6e8ab446b934823ce69fee8ce85373f0	\N	\N	\N	\N	\N	\N	{"id": "a9defaeb-cdc2-41c6-9848-6e731f3101be", "name": "Muhammad Shameel K S", "email": "muhammadshameel.ks@speehive.com"}	2026-07-22 09:33:25.333+00	\N	\N	\N	\N	1201488194030863
dca65869-e4e9-49fe-a69d-ad5504220d42	474ddf05-3384-4f9f-923a-20d3b9bdfb8b	1216717826097403	6e8ab446b934823ce69fee8ce85373f0	\N	\N	\N	\N	\N	\N	{"id": "a9defaeb-cdc2-41c6-9848-6e731f3101be", "name": "Muhammad Shameel K S", "email": "muhammadshameel.ks@speehive.com"}	2026-07-10 07:23:04.272+00	guu8QrPKS5E0hW_-CqCq3Q	kONwdD2PosJafraMvK8wLMjbkC6xnDlZlBy8mTeOB30	\N	\N	\N
6e891477-ae14-46e6-a9de-ebbb0b8bb523	d9092b84-f6ec-42cd-821d-7eff0ae04c3e	1216717826097403	6e8ab446b934823ce69fee8ce85373f0	\N	\N	\N	\N	\N	\N	{"id": "7bb40b67-ddae-4bab-a89f-f4d59ad3bd92", "name": "Mohammed Raeed K A", "email": "mohammedraeed.ka@speehive.com"}	2026-07-16 08:26:32.436+00	\N	\N	\N	\N	\N
06e3b446-07d2-4dea-9cfe-68df3ca4a856	e4c3dca9-5e96-4bf8-8138-6481ce64910f	1216717826097403	6e8ab446b934823ce69fee8ce85373f0	\N	\N	\N	\N	\N	\N	{"id": "fad8923f-6a42-44b4-a1bf-4cf2c6a40e32", "name": "Sanil Davis", "email": "sanil.davis@speehive.com"}	2026-07-10 10:42:09.284+00	\N	\N	\N	\N	\N
cc4a61f3-a06a-4f52-b564-6f0fee78a742	2cdc80f8-888f-4aff-8508-2f63b544546f	1216717826097403	6e8ab446b934823ce69fee8ce85373f0	\N	\N	\N	\N	\N	\N	{"id": "8f0e5f13-6f7d-4517-9456-eb26bc397acc", "name": "Mohamed Afran", "email": "mohamed.afran@speehive.com"}	2026-07-16 09:53:14.158+00	\N	\N	\N	\N	\N
fc0ea33c-8847-42c3-a6e5-3a66aadc426f	38458bae-b6a3-4f51-b27b-9d85bc5fc7e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-21 20:52:41.67358+00	\N	\N	\N	\N	\N
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 47, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict Ld9UGyW0DEmztoSkvWZBu4q6Ar8odex2U5elCI3coqavw2SSM43jkq0JRsZiaks

RESET ALL;
