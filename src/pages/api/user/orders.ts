import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { product_id, username: requestUsername, quantity, delivery_date, notes } = await request.json();
    let username = requestUsername;

    console.log('Bestellung empfangen:', { product_id, username, quantity, delivery_date, notes });

    // Benutzername aus Cookie extrahieren (Priorität über Request-Body)
    const cookies = request.headers.get('cookie');
    console.log('Alle Cookies:', cookies);
    
    if (cookies) {
      const userSessionMatch = cookies.match(/user_session=([^;]+)/);
      console.log('Session Match:', userSessionMatch);
      
      if (userSessionMatch) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(userSessionMatch[1]));
          console.log('Session Data:', sessionData);
          
          if (sessionData && sessionData.username) {
            username = sessionData.username;
            console.log('Benutzername aus Cookie extrahiert:', username);
          }
        } catch (error) {
          console.error('Fehler beim Parsen der Session:', error);
        }
      }
    }

    if (!product_id || !username || !quantity || !delivery_date) {
      console.error('Fehlende Parameter:', { product_id, username, quantity, delivery_date });
      return new Response(JSON.stringify({ error: 'Produkt-ID, Benutzername, Menge und Lieferdatum sind erforderlich' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validierung der Eingabedaten
    if (username === '{username}' || username === '' || username === null || username === 'User') {
      console.error('Ungültiger Benutzername:', username);
      return new Response(JSON.stringify({ error: 'Ungültiger Benutzername' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (parseInt(quantity) <= 0) {
      console.error('Ungültige Menge:', quantity);
      return new Response(JSON.stringify({ error: 'Menge muss größer als 0 sein' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfen ob das Produkt existiert und Lagerbestand abrufen
    const { data: productCheck, error: productError } = await supabase
      .from('products')
      .select('id, stock, name')
      .eq('id', parseInt(product_id))
      .single();

    if (productError || !productCheck) {
      console.error('Produkt nicht gefunden:', product_id);
      return new Response(JSON.stringify({ error: 'Produkt nicht gefunden' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfen ob genügend Lagerbestand vorhanden ist
    const currentStock = productCheck.stock;
    const requestedQuantity = parseInt(quantity);
    
    if (currentStock < requestedQuantity) {
      console.error('Nicht genügend Lagerbestand:', { currentStock, requestedQuantity, productName: productCheck.name });
      return new Response(JSON.stringify({ 
        error: `Nicht genügend Lagerbestand verfügbar. Verfügbar: ${currentStock}, Bestellt: ${requestedQuantity}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prüfen ob die orders Tabelle existiert
    const { data: tableCheck, error: tableError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('Fehler beim Prüfen der orders Tabelle:', tableError);
      return new Response(JSON.stringify({ 
        error: 'Datenbank-Tabelle "orders" existiert nicht. Bitte führen Sie das Datenbank-Setup aus.',
        details: tableError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Neue Bestellung erstellen
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          product_id: parseInt(product_id),
          username,
          quantity: parseInt(quantity),
          delivery_date,
          notes: notes || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Erstellen der Bestellung:', error);
      return new Response(JSON.stringify({ 
        error: 'Fehler beim Erstellen der Bestellung',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lagerbestand reduzieren
    const newStock = currentStock - requestedQuantity;
    console.log('Versuche Lagerbestand zu aktualisieren:', {
      productId: parseInt(product_id),
      oldStock: currentStock,
      newStock: newStock,
      requestedQuantity: requestedQuantity
    });
    
    // Versuche Lagerbestand mit Supabase Update zu aktualisieren
    const { data: updateData, error: stockUpdateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', parseInt(product_id))
      .select();

    if (stockUpdateError) {
      console.error('Fehler beim Aktualisieren des Lagerbestands mit Supabase:', stockUpdateError);
      
      // Alternative: Direkte SQL-Abfrage verwenden
      try {
        const { data: sqlUpdateData, error: sqlError } = await supabase.rpc('update_product_stock', {
          product_id: parseInt(product_id),
          new_stock: newStock
        });
        
        if (sqlError) {
          console.error('Fehler bei SQL-Update:', sqlError);
          return new Response(JSON.stringify({ 
            error: 'Bestellung erstellt, aber Lagerbestand konnte nicht aktualisiert werden',
            details: sqlError.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        console.log('Lagerbestand erfolgreich mit SQL aktualisiert:', sqlUpdateData);
      } catch (sqlError) {
        console.error('Fehler bei SQL-Update:', sqlError);
        return new Response(JSON.stringify({ 
          error: 'Bestellung erstellt, aber Lagerbestand konnte nicht aktualisiert werden',
          details: sqlError instanceof Error ? sqlError.message : 'Unbekannter SQL-Fehler'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      console.log('Lagerbestand erfolgreich mit Supabase aktualisiert:', updateData);
    }

    console.log('Bestellung erfolgreich erstellt und Lagerbestand aktualisiert:', {
      order: data,
      oldStock: currentStock,
      newStock: newStock,
      productName: productCheck.name
    });

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      stockUpdate: {
        oldStock: currentStock,
        newStock: newStock,
        productName: productCheck.name
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fehler in orders POST:', error);
    return new Response(JSON.stringify({ 
      error: 'Interner Server-Fehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, request }) => {
  try {
    let username = url.searchParams.get('username');

    console.log('Orders GET - URL Username:', username);

    // Falls username Template-Variable ist, aus Cookie extrahieren
    if (!username || username === '{username}' || username === 'User') {
      const cookies = request.headers.get('cookie');
      console.log('Orders GET - Cookies:', cookies);
      
      if (cookies) {
        const userSessionMatch = cookies.match(/user_session=([^;]+)/);
        if (userSessionMatch) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(userSessionMatch[1]));
            console.log('Orders GET - Session Data:', sessionData);
            
            if (sessionData && sessionData.username) {
              username = sessionData.username;
              console.log('Orders GET - Benutzername aus Cookie:', username);
            }
          } catch (error) {
            console.error('Orders GET - Fehler beim Parsen der Session:', error);
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

    // Bestellungen mit Produktdetails abrufen
    const { data, error } = await supabase
      .from('orders')
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
      console.error('Fehler beim Abrufen der Bestellungen:', error);
      return new Response(JSON.stringify({ error: 'Fehler beim Abrufen der Bestellungen' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fehler in orders GET:', error);
    return new Response(JSON.stringify({ error: 'Interner Server-Fehler' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 