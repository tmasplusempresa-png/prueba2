import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const AGORA_APP_ID = Deno.env.get("AGORA_APP_ID") || "e7f6e9aeecf14b2ba10e3f40be9f56e7";
const AGORA_APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE") || "5e1c44bcfc5942aaadcab5b893a07d56";

// RtcRole values
enum RtcRole {
  SUBSCRIBER = 0,
  PUBLISHER = 1,
}


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
    const { channel, uid, role = "publisher" } = await req.json();

    if (!channel || uid === undefined) {
      return new Response(
        JSON.stringify({ error: "channel and uid are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const rtcRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    
    // Generar token de forma async
    const currentTime = Math.floor(Date.now() / 1000);
    const expiration = currentTime + 3600;

    const header = {
      typ: "JWT",
      alg: "HS256",
    };

    const payload = {
      iss: "agora",
      exp: expiration,
      iat: currentTime,
      cid: channel,
      uid: parseInt(uid),
      role: rtcRole,
    };

    const headerEncoded = encodeBase64(JSON.stringify(header))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const payloadEncoded = encodeBase64(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const message = `${headerEncoded}.${payloadEncoded}`;
    
    // Generar HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(AGORA_APP_CERTIFICATE);
    const msgData = encoder.encode(message);

    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, msgData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureBase64 = encodeBase64(String.fromCharCode(...signatureArray));
    const signature = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const token = `${message}.${signature}`;

    console.log(`✅ Generated Agora token for channel: ${channel}, uid: ${uid}`);

    return new Response(
      JSON.stringify({
        token: token,
        expiresIn: 3600,
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
    console.error("❌ Error generating token:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate token",
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
