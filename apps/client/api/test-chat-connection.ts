import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log('--- Configuration Check ---');
console.log('Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('Supabase Key:', supabaseKey ? 'OK' : 'MISSING');
console.log('OpenAI Key:', openaiKey ? 'OK' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('\n--- Database Check ---');
    try {
        // 1. Check if we can connect
        const { data, error } = await supabase.from('conversations').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Error connecting to "conversations" table:', error.message);
            if (error.code === '42P01') {
                console.error('HINT: The table "conversations" does not exist. Run the migration.');
            }
        } else {
            console.log('Successfully connected to "conversations" table.');
            console.log('Row count:', data);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

async function testOpenAI() {
    console.log('\n--- OpenAI Check ---');
    if (!openaiKey) {
        console.warn('Skipping OpenAI test: No API key found.');
        return;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${openaiKey}` }
        });

        if (response.ok) {
            console.log('OpenAI API Key is valid (Models list accessible).');
        } else {
            console.error('OpenAI API Key invalid:', await response.statusText);
        }
    } catch (err) {
        console.error('Error connecting to OpenAI:', err);
    }
}

async function run() {
    await testConnection();
    await testOpenAI();
}

run();
