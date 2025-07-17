import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
    try {
        // Test 1: Supabase-Verbindung
        const { data: connectionTest, error: connectionError } = await supabase
            .from('access_codes')
            .select('count')
            .limit(1);

        if (connectionError) {
            return new Response(JSON.stringify({ 
                error: 'Datenbankverbindung fehlgeschlagen',
                details: connectionError.message
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Test 2: Zugangscodes prüfen
        const { data: accessCodes, error: accessCodesError } = await supabase
            .from('access_codes')
            .select('*')
            .limit(5);

        if (accessCodesError) {
            return new Response(JSON.stringify({ 
                error: 'Zugangscodes-Tabelle nicht gefunden',
                details: accessCodesError.message
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Test 3: User-Accounts-Tabelle prüfen
        const { data: userAccounts, error: userAccountsError } = await supabase
            .from('user_accounts')
            .select('*')
            .limit(1);

        if (userAccountsError) {
            return new Response(JSON.stringify({ 
                error: 'User-Accounts-Tabelle nicht gefunden',
                details: userAccountsError.message,
                solution: 'Führen Sie das supabase-setup.sql Skript aus'
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Datenbankverbindung erfolgreich',
            accessCodes: accessCodes,
            userAccounts: userAccounts
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Datenbanktest-Fehler:', error);
        return new Response(JSON.stringify({ 
            error: 'Ein interner Fehler ist aufgetreten',
            details: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}; 