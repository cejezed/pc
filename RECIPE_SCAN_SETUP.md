# Recipe Scan Setup Guide

## Overzicht

De recipe scan feature gebruikt OpenAI's GPT-4 Vision API om receptkaarten te scannen en automatisch te converteren naar gestructureerde recepten in je database.

## Setup Instructies

### 1. Supabase Storage Bucket aanmaken

**BELANGRIJK:** Je moet eerst een storage bucket aanmaken in Supabase:

1. Ga naar je Supabase project dashboard
2. Klik op "Storage" in het menu
3. Klik op "Create a new bucket"
4. Naam: `recipe-images`
5. **Public bucket:** Ja (aanvinken)
6. **File size limit:** 10MB
7. Klik op "Create bucket"

**Bucket policies instellen:**

Ga naar de bucket policies en voeg toe:

```sql
-- Allow authenticated users to upload their own images
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'recipe-images',
  'Users can upload their own recipe images',
  'bucket_id = ''recipe-images'' AND auth.role() = ''authenticated'''
);

-- Allow public read access to all images
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'recipe-images',
  'Public read access',
  'bucket_id = ''recipe-images'''
);
```

### 2. OpenAI API Key verkrijgen

1. Ga naar [OpenAI Platform](https://platform.openai.com/api-keys)
2. Log in of maak een account aan
3. Klik op "Create new secret key"
4. Kopieer de key (je kunt deze maar één keer zien!)

### 3. Environment Variables configureren

Open `.env` in de root van het project en vul in:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Recipe Scanning (REQUIRED)
RECIPE_SCAN_MODE=ai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Waar vind je de Supabase keys?**
1. Ga naar je Supabase dashboard
2. Project Settings > API
3. Kopieer de URL en keys

### 4. Deploy naar Vercel

Zorg dat je environment variables ook in Vercel hebt ingesteld:

1. Ga naar je Vercel project
2. Settings > Environment Variables
3. Voeg toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RECIPE_SCAN_MODE` = `ai`
   - `OPENAI_API_KEY`

4. Redeploy het project

### 5. Kosten

De feature gebruikt GPT-4 Vision Preview, wat kosten met zich meebrengt:
- Ongeveer $0.01 - $0.03 per foto scan
- Afhankelijk van de foto grootte en complexiteit

**Let op:** Zorg dat je billing hebt ingesteld in je OpenAI account.

### 6. Testen

1. Log in op de app
2. Navigeer naar "Mijn Keuken" > "Recepten"
3. Klik op "Scan Kaart"
4. Upload een foto van een receptkaart (JPEG, PNG, WebP, HEIC)
5. De AI extraheert automatisch:
   - Titel
   - Ingrediënten met hoeveelheden
   - Bereidingsstappen
   - Tijd en porties
   - Tags

## Development Mode (Geen API kosten)

Voor development zonder API kosten, gebruik stub mode:

```bash
RECIPE_SCAN_MODE=stub
```

Dit retourneert altijd dummy data (Zoetzure Kip recept) zonder OpenAI API calls.

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"
- Controleer of de key correct is ingevuld in `.env`
- Restart de development server na het toevoegen van de key
- Bij Vercel: check of de env variable is toegevoegd en redeploy

### Error: "Failed to upload image: Bucket not found"
- Je hebt de `recipe-images` bucket nog niet aangemaakt in Supabase
- Volg stap 1 hierboven

### Error: "Unauthorized"
- Controleer of je Supabase keys correct zijn ingevuld
- Check of de user ingelogd is

### Error: "Insufficient quota"
- Je OpenAI account heeft geen credits meer
- Voeg billing toe via https://platform.openai.com/account/billing

### Scan duurt lang
- GPT-4 Vision kan 5-15 seconden duren
- Dit is normaal voor AI vision processing

### Foutieve extractie
- Probeer een duidelijkere foto
- Zorg voor goede belichting
- De AI werkt het best met typed receptkaarten (zoals Hello Fresh, Marley Spoon)

## Technische Details

- **Upload:** Foto wordt geüpload naar Supabase Storage (`recipe-images` bucket)
- **AI Processing:** OpenAI GPT-4 Vision analyseert de foto
- **Structuur:** AI retourneert gestructureerde JSON met receptgegevens
- **Opslag:** Recept wordt opgeslagen in Supabase database met link naar foto
