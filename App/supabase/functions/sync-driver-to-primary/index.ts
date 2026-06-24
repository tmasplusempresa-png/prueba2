import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SECONDARY_SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SECONDARY_SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const PRIMARY_SUPABASE_URL = Deno.env.get("PRIMARY_SUPABASE_URL") || "";
const PRIMARY_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("PRIMARY_SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!PRIMARY_SUPABASE_URL || !PRIMARY_SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Primary Supabase credentials not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing bearer token" }, 401);
  }

  const secondaryAuthClient = createClient(SECONDARY_SUPABASE_URL, SECONDARY_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await secondaryAuthClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  const callerUser = userData.user;

  let payload: {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    mobile?: string;
    city?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { email, password, first_name, last_name, mobile, city } = payload;

  if (!email || !password || !first_name || !last_name) {
    return jsonResponse(
      { error: "Missing required fields: email, password, first_name, last_name" },
      400,
    );
  }

  if (callerUser.email && callerUser.email.toLowerCase() !== email.toLowerCase()) {
    return jsonResponse({ error: "Token email does not match payload email" }, 403);
  }

  const primaryAdmin = createClient(PRIMARY_SUPABASE_URL, PRIMARY_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: created, error: createError } = await primaryAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name,
      last_name,
      mobile,
      city,
      synced_from_secondary: true,
      secondary_user_id: callerUser.id,
    },
  });

  if (createError) {
    const message = createError.message || "";
    const alreadyExists =
      message.toLowerCase().includes("already") ||
      message.toLowerCase().includes("registered") ||
      message.toLowerCase().includes("duplicate");

    if (alreadyExists) {
      return jsonResponse(
        { ok: true, alreadyExists: true, message: "User already exists in primary" },
        200,
      );
    }
    return jsonResponse({ error: message || "Failed to create user in primary" }, 500);
  }

  return jsonResponse({
    ok: true,
    alreadyExists: false,
    primary_user_id: created.user?.id,
  });
});
