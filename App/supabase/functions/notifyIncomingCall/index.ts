import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Crear cliente de Supabase con permisos de admin (service role)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { customerId, driverId, driverName, channelName } = await req.json();

    if (!customerId || !driverId || !driverName || !channelName) {
      return new Response(
        JSON.stringify({
          error: "customerId, driverId, driverName, and channelName are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Guardar notificación de llamada entrante en Supabase
    const { data, error } = await supabase.from("call_notifications").insert([
      {
        customer_id: customerId,
        driver_id: driverId,
        driver_name: driverName,
        channel_name: channelName,
        status: "pending", // pending, accepted, declined, missed
        created_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      console.error("❌ Error saving call notification:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to save notification",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(
      `✅ Notified customer: ${customerId} of call from ${driverName} (${driverId})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        notification: data?.[0],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process notification",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
