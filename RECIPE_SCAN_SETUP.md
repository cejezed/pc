# Recipe Scan Setup Guide

## Overzicht

De recipe scan feature gebruikt OpenAI's GPT-4 Vision API om receptkaarten te scannen en automatisch te converteren naar gestructureerde recepten in je database.

## Setup Instructies

### 1. OpenAI API Key verkrijgen

1. Ga naar [OpenAI Platform](https://platform.openai.com/api-keys)
2. Log in of maak een account aan
3. Klik op "Create new secret key"
4. Kopieer de key (je kunt deze maar één keer zien!)

### 2. Configuratie

1. Open `.env` in de root van het project
2. Vul je OpenAI API key in:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Zorg dat de scan mode op 'ai' staat (standaard):

```bash
RECIPE_SCAN_MODE=ai
```

### 3. Kosten

De feature gebruikt GPT-4 Vision Preview, wat kosten met zich meebrengt:
- Ongeveer $0.01 - $0.03 per foto scan
- Afhankelijk van de foto grootte en complexiteit

**Let op:** Zorg dat je billing hebt ingesteld in je OpenAI account.

### 4. Testen

1. Start de development server:
```bash
npm run dev
```

2. Navigeer naar "Mijn Keuken" > "Recepten"
3. Klik op "Scan Kaart"
4. Upload een foto van een receptkaart
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

### Error: "Insufficient quota"
- Je OpenAI account heeft geen credits meer
- Voeg billing toe via https://platform.openai.com/account/billing

### Scan duurt lang
- GPT-4 Vision kan 5-15 seconden duren
- Dit is normaal voor AI vision processing

### Foutieve extractie
- Probeer een duidelijkere foto
- Zorg voor goede belichting
- De AI werkt het best met typed receptkaarten
