import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Session-Cookie löschen
    cookies.delete('user_session', {
      path: '/'
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Server-Fehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 