import psycopg2
from datetime import date, timedelta
from decimal import Decimal

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/billnow')
cur = conn.cursor()
cur.execute("SELECT id FROM users WHERE email='demo@billnow.app';")
row = cur.fetchone()
if row:
    user_id = row[0]
    today = date.today()

    # Samsung Refrigerator: expires in 18 days
    cur.execute("SELECT id FROM products WHERE user_id=%s AND name LIKE %s;", (user_id, 'Samsung Refrigerator%'))
    prod_row = cur.fetchone()
    if prod_row:
        cur.execute("""
            UPDATE products SET 
                warranty_end_date = %s,
                warranty_start_date = %s,
                purchase_date = %s,
                purchase_price = 65000.00,
                seller = 'ABC Electronics',
                model_number = 'RF28T5001SR',
                category = 'Refrigerator',
                brand = 'Samsung'
            WHERE id = %s;
        """, (today + timedelta(days=18), today - timedelta(days=347), today - timedelta(days=347), prod_row[0]))
        print("Updated Samsung Refrigerator: 18 days remaining")
    else:
        cur.execute("""
            INSERT INTO products (
                id, user_id, name, category, brand, model_number, serial_number,
                purchase_date, purchase_price, currency, seller,
                warranty_start_date, warranty_period_months, warranty_end_date,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), %s, 'Samsung Refrigerator', 'Refrigerator', 'Samsung',
                'RF28T5001SR', 'SRF882194',
                %s, 65000.00, 'INR', 'ABC Electronics',
                %s, 12, %s,
                NOW(), NOW()
            );
        """, (user_id, today - timedelta(days=347), today - timedelta(days=347), today + timedelta(days=18)))
        print("Inserted Samsung Refrigerator: 18 days remaining")

    # LG Washing Machine: 10 months remaining
    cur.execute("SELECT id FROM products WHERE user_id=%s AND name LIKE %s;", (user_id, 'LG Washing Machine%'))
    wm_row = cur.fetchone()
    if wm_row:
        cur.execute("""
            UPDATE products SET
                warranty_end_date = %s,
                warranty_start_date = %s,
                purchase_date = %s,
                purchase_price = 32000.00,
                seller = 'Vijay Sales',
                model_number = 'FHM1207ZDL',
                category = 'Washing Machine',
                brand = 'LG'
            WHERE id = %s;
        """, (today + timedelta(days=304), today - timedelta(days=425), today - timedelta(days=425), wm_row[0]))
        print("Updated LG Washing Machine: 10 months remaining")

    conn.commit()
    print("Done setting up prompt sample products.")

cur.close()
conn.close()
