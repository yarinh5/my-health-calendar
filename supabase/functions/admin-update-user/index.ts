import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await anonClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, userId, email, password, displayName } = await req.json();

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "updateUser") {
      const updates: Record<string, any> = {};
      
      if (email) {
        updates.email = email;
      }
      if (password) {
        updates.password = password;
      }

      if (Object.keys(updates).length > 0) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, updates);
        if (authUpdateError) {
          return new Response(
            JSON.stringify({ error: authUpdateError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Update profile
      if (displayName || email) {
        const profileUpdates: Record<string, any> = {};
        if (displayName) profileUpdates.display_name = displayName;
        if (email) profileUpdates.email = email;

        const { error: profileError } = await adminClient
          .from("profiles")
          .update(profileUpdates)
          .eq("id", userId);

        if (profileError) {
          return new Response(
            JSON.stringify({ error: profileError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deleteUser") {
      // Delete user from auth (cascade will handle profiles and appointments)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "toggleAdmin") {
      const { data: existingRole } = await adminClient
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        // Remove admin role - but update to 'user' instead of delete
        const { error } = await adminClient
          .from("user_roles")
          .update({ role: "user" })
          .eq("id", existingRole.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Check if user has any role
        const { data: userRole } = await adminClient
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (userRole) {
          // Update existing role to admin
          const { error } = await adminClient
            .from("user_roles")
            .update({ role: "admin" })
            .eq("id", userRole.id);

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          // Insert new admin role
          const { error } = await adminClient
            .from("user_roles")
            .insert({ user_id: userId, role: "admin" });

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
