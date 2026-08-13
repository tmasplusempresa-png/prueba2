import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Borrado de cuenta exigido por la Guideline 5.1.1(v) de Apple: toda app que
// permita registrarse debe permitir eliminar la cuenta desde dentro de la app.
//
// No se borra la fila de users: se anonimiza. Los viajes ya realizados tienen
// valor contable y operativo, y borrar al usuario dejaria reservas huerfanas o
// las arrastraria por cascada. Anonimizar conserva el historial sin conservar a
// la persona, que es lo que exige la guideline y lo que pidio el negocio.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return jsonResponse({ error: "Credenciales de Supabase no configuradas" }, 500);
  }

  // 1. Identificar al solicitante por su propio token. Nunca se acepta un id
  //    por el body: eso permitiria a cualquiera borrar la cuenta de otro.
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Falta el token de sesion" }, 401);
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Sesion invalida" }, 401);
  }

  const authId = userData.user.id;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 2. Localizar la fila de la app. auth_id es el vinculo con auth.users.
  const { data: perfil, error: perfilError } = await admin
    .from("users")
    .select("id, user_type")
    .eq("auth_id", authId)
    .maybeSingle();

  if (perfilError) {
    return jsonResponse({ error: `No se pudo leer el perfil: ${perfilError.message}` }, 500);
  }

  // 3. Bloquear el borrado si hay un viaje sin cerrar. Dejar un viaje activo
  //    con un usuario anonimo deja tirada a la contraparte.
  if (perfil?.id) {
    const columnaViaje = perfil.user_type === "driver" ? "driver" : "customer";
    const { data: enCurso } = await admin
      .from("bookings")
      .select("id")
      .eq(columnaViaje, perfil.id)
      .in("status", ["NEW", "ACCEPTED", "ARRIVED", "STARTED", "REACHED", "PENDING", "PAID"])
      .limit(1);

    if (enCurso && enCurso.length > 0) {
      return jsonResponse(
        {
          error: "VIAJE_ACTIVO",
          message:
            "Tienes un viaje en curso. Finalizalo antes de eliminar tu cuenta.",
        },
        409,
      );
    }
  }

  // 4. Anonimizar. El correo queda unico para no chocar con la restriccion de
  //    unicidad si la hubiera, y sin dominio real para que no reciba nada.
  const sufijo = authId.slice(0, 8);
  const anonimo: Record<string, unknown> = {
    first_name: "Usuario",
    last_name: "eliminado",
    email: `eliminado+${sufijo}@invalid.local`,
    mobile: null,
    location: null,
    city: null,
    company_name: null,
    // Documentos e imagenes: todo dato identificable
    profile_image: null,
    car_image: null,
    card_prop_image: null,
    card_prop_image_bk: null,
    license_image: null,
    license_image_back: null,
    soat_image: null,
    verify_id_image: null,
    verify_id_image_bk: null,
    verify_id_image_data: null,
    document_number: null,
    document_type: null,
    license_number: null,
    bank_number: null,
    vehicle_number: null,
    vehicle_make: null,
    // Notificaciones: que no le llegue nada nunca mas
    push_token: null,
    push_device_model: null,
    push_platform: null,
    // Referidos: rompe el vinculo con su red
    referral_id: null,
    referred_by_code: null,
    // Estado: cuenta inutilizable
    is_active: false,
    blocked: true,
    approved: false,
    is_verified: false,
    verified: false,
    driver_active_status: false,
    updated_at: new Date().toISOString(),
  };

  if (perfil?.id) {
    const { error: updateError } = await admin
      .from("users")
      .update(anonimo)
      .eq("id", perfil.id);

    if (updateError) {
      return jsonResponse(
        { error: `No se pudo anonimizar el perfil: ${updateError.message}` },
        500,
      );
    }
  }

  // 5. Inutilizar el acceso. Se cierran las sesiones abiertas y se deja la
  //    entrada de auth sin credenciales usables.
  //
  //    No se hace admin.deleteUser a proposito: varias tablas referencian
  //    auth.users (memberships.conductor, entre otras) y un borrado en cascada
  //    se llevaria por delante el historial que acabamos de anonimizar. La
  //    cuenta queda irrecuperable igual: no se puede iniciar sesion con ella.
  const { error: banError } = await admin.auth.admin.updateUserById(authId, {
    email: `eliminado+${sufijo}@invalid.local`,
    password: crypto.randomUUID() + crypto.randomUUID(),
    ban_duration: "876000h", // 100 anios
    user_metadata: { deleted_at: new Date().toISOString() },
  });

  if (banError) {
    return jsonResponse(
      { error: `Perfil anonimizado, pero no se pudo cerrar el acceso: ${banError.message}` },
      500,
    );
  }

  await admin.auth.admin.signOut(authId).catch(() => {});

  return jsonResponse({ ok: true, message: "Cuenta eliminada" });
});
