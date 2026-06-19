// middleware.ts  (Next.js 15 — NOT proxy.ts which is Next.js 16)
//
// RESPONSIBILITY: Session refresh and cookie synchronization ONLY.
// This middleware does NOT contain business logic or role-based redirects.
// All route protection is handled at the Server Action / Route Handler level
// via the DAL (lib/dal.ts verifySession / assertRole).
//
// The matcher covers /rsvp/[token] and /invite/[token] paths so Supabase can
// handle cookie synchronization, but those routes do their own no-auth handling.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // NEVER getSession() here — use getUser() to validate JWT against Auth server.
  // This call also refreshes the session token if it has expired.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Image extensions (svg, png, jpg, jpeg, gif, webp)
     *
     * /rsvp/[token] and /invite/[token] ARE covered for cookie handling.
     * Those routes handle their own no-auth access logic.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
