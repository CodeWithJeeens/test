import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { accessCode } = await request.json();

        if (!accessCode) {
            return new Response(JSON.stringify({ 
                error: 'Zugangscode ist erforderlich' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Zugangscode in der Datenbank validieren
        const { data: accessCodeData, error: accessCodeError } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', accessCode)
            .eq('is_active', true)
            .single();

        if (accessCodeError || !accessCodeData) {
            return new Response(JSON.stringify({ 
                error: 'Ungültiger Zugangscode' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Session-Cookie setzen
        const sessionData = {
            accessCode: accessCodeData.code,
            type: 'user_access_code'
        };

        cookies.set('user_session', JSON.stringify(sessionData), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 7 Tage
        });

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Anmeldung erfolgreich'
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Ein interner Fehler ist aufgetreten' 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 