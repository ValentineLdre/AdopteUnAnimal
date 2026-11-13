import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const animals = JSON.parse(fs.readFileSync(new URL('../data/demo-animals.json', import.meta.url), 'utf8'));

console.log(`Import des ${animals.length} fiches de démonstration…`);
let inserted = 0, skipped = 0;
for (const animal of animals) {
  const { data: existing, error: lookupError } = await supabase.from('animals').select('id').eq('name', animal.name).eq('species', animal.species).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) { skipped++; continue; }
  const { error } = await supabase.from('animals').insert(animal);
  if (error) throw error;
  inserted++;
}
console.log(`Terminé : ${inserted} ajoutée(s), ${skipped} déjà présente(s).`);
console.log('Attention : ces fiches sont des exemples de démonstration. Vérifiez leur contenu avant publication.');
