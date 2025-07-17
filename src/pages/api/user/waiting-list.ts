import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { product_id } = await request.json();
    let username = '';

    console.log('Warteschlange - Empfangene Daten:', { product_id });

    // Benutzername aus Cookie extrahieren
    const cookies = request.headers.get('cookie');
    console.log('Warteschlange - Cookies:', cookies);
    
    if (cookies) {
      const userSessionMatch = cookies.match(/user_session=([^;]+)/);
      if (userSessionMatch) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(userSessionMatch[1]));
          console.log('Warteschlange - Session Data:', sessionData);
          
          if (sessionData && sessionData.username) {
            username = sessionData.username;
            console.log('Warteschlange - Benutzername aus Cookie:', username);
          }
        } catch (error) {
          console.error('Warteschlange - Fehler beim Parsen der Session:', error);
        }
      }
    }

    if (!product_id || !username) {
      return new Response(JSON.stringify({ error: 'Produkt-ID und Benutzername sind erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfen ob bereits ein Eintrag für dieses Produkt und Benutzer existiert
    const { data: existingEntry } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('product_id', product_id)
      .eq('username', username)
      .single();

    if (existingEntry) {
      return new Response(JSON.stringify({ error: 'Sie sind bereits in der Warteschlange für dieses Produkt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Neuen Warteschlangen-Eintrag erstellen
    const { data, error } = await supabase
      .from('waiting_list')
      .insert([
        {
          product_id,
          username,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen der Warteschlange:', error);
      return new Response(JSON.stringify({ error: 'Fehler beim Hinzufügen zur Warteschlange' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fehler in waiting-list POST:', error);
    return new Response(JSON.stringify({ error: 'Interner Server-Fehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, request }) => {
  try {
    let username = url.searchParams.get('username');

    console.log('Warteschlange GET - URL Username:', username);

    // Falls username Template-Variable ist, aus Cookie extrahieren
    if (!username || username === '{username}' || username === 'User') {
      const cookies = request.headers.get('cookie');
      console.log('Warteschlange GET - Cookies:', cookies);
      
      if (cookies) {
        const userSessionMatch = cookies.match(/user_session=([^;]+)/);
        if (userSessionMatch) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(userSessionMatch[1]));
            console.log('Warteschlange GET - Session Data:', sessionData);
            
            if (sessionData && sessionData.username) {
              username = sessionData.username;
              console.log('Warteschlange GET - Benutzername aus Cookie:', username);
            }
          } catch (error) {
            console.error('Warteschlange GET - Fehler beim Parsen der Session:', error);
          }
        }
      }
    }

    if (!username) {
      return new Response(JSON.stringify({ error: 'Benutzername ist erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Warteschlangen-Einträge mit Produktdetails abrufen
    const { data, error } = await supabase
      .from('waiting_list')
      .select(`
        *,
        products (
          id,
          name,
          category,
          description,
          marke,
          verkaufspreis,
          stock
        )
      `)
      .eq('username', username)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Abrufen der Warteschlange:', error);
      return new Response(JSON.stringify({ error: 'Fehler beim Abrufen der Warteschlange' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fehler in waiting-list GET:', error);
    return new Response(JSON.stringify({ error: 'Interner Server-Fehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Eintrags-ID ist erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabase
      .from('waiting_list')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Fehler beim Löschen der Warteschlange:', error);
      return new Response(JSON.stringify({ error: 'Fehler beim Löschen der Warteschlange' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fehler in waiting-list DELETE:', error);
    return new Response(JSON.stringify({ error: 'Interner Server-Fehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 