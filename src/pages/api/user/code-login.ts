import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { accessCode } = await request.json();

        // Validierung der Eingabedaten
        if (!accessCode) {
            return new Response(JSON.stringify({ 
                error: 'Zugangscode ist erforderlich' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Code-Format validieren (XXXX-XXXXX-XXXXX-XXXX)
        const codePattern = /^[A-Z0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{4}$/;
        if (!codePattern.test(accessCode)) {
            return new Response(JSON.stringify({ 
                error: 'Ungültiges Code-Format. Erwartet: XXXX-XXXXX-XXXXX-XXXX' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Zugangscode in der Datenbank suchen
        const { data: accessCodeData, error: accessCodeError } = await supabase
            .from('access_codes')
            .select('id, code, is_active')
            .eq('code', accessCode)
            .single();

        if (accessCodeError || !accessCodeData) {
            return new Response(JSON.stringify({ 
                error: 'Ungültiger Zugangscode' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prüfen ob Code aktiv ist
        if (!accessCodeData.is_active) {
            return new Response(JSON.stringify({ 
                error: 'Dieser Zugangscode ist nicht mehr aktiv' 
            }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Session-Cookie setzen (ohne spezifischen Benutzer)
        const sessionData = {
            accessCodeId: accessCodeData.id,
            accessCode: accessCodeData.code,
            username: `User-${accessCodeData.code.substring(0, 8)}`, // Generierter Benutzername
            type: 'code_login'
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
            message: 'Anmeldung erfolgreich',
            user: {
                id: accessCodeData.id,
                username: sessionData.username
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Code-Login Fehler:', error);
        return new Response(JSON.stringify({ 
            error: 'Ein interner Fehler ist aufgetreten' 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 