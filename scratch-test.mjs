import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load .env.local
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: integrations, error: dbError } = await supabase
    .from("user_integrations")
    .select("*");
  
  if (dbError) {
    console.error("Database query error:", dbError.message);
  } else {
    console.log("Integrations found:", integrations.length);
    for (const integration of integrations) {
      console.log("User ID:", integration.user_id);
      console.log("Has Asana access token:", !!integration.asana_access_token);
      console.log("Asana expires at:", integration.asana_expires_at);
    }
  }
}

run();
