# Brikx Styling Guide

## Overzicht

Dit project gebruikt een gecentraliseerde styling aanpak met custom CSS classes en Tailwind utility classes. Alle styling is gedefinieerd in `brikx-theme.css` en `tailwind.config.js`.

## Card Styling

### Basis Cards
```tsx
// Simpele card met basic styling
<div className="card-brikx">
  <h3>Titel</h3>
  <p>Content</p>
</div>

// Interactieve card met hover effect
<div className="card-brikx-interactive">
  <h3>Klikbare card</h3>
</div>

// Donkere card met gradient
<div className="card-brikx-dark">
  <h3>Premium content</h3>
</div>
```

### Moderne Cards
```tsx
// Moderne card met shadows en backdrop blur
<div className="card-brikx-modern">
  <h3>Modern design</h3>
</div>

// Card met gradient achtergrond
<div className="card-brikx-modern-gradient">
  <h3>Gradient card</h3>
</div>

// Grote section card
<div className="card-brikx-section">
  <h2>Section titel</h2>
  <p>Grotere padding en styling</p>
</div>

// Lege state card
<div className="card-brikx-empty">
  <p>Geen items</p>
</div>
```

## Button Styling

```tsx
// Primary button
<button className="btn-brikx-primary">
  Opslaan
</button>

// Secondary button
<button className="btn-brikx-secondary">
  Annuleren
</button>

// Danger button
<button className="btn-brikx-danger">
  Verwijderen
</button>
```

## Input Styling

```tsx
// Text input
<input type="text" className="input-brikx" />

// Select dropdown
<select className="select-brikx">
  <option>Optie 1</option>
</select>

// Textarea
<textarea className="textarea-brikx"></textarea>
```

## Modern UI Utilities

### Gradient Text
```tsx
// Brikx gradient (teal naar blauw)
<h1 className="gradient-text-brikx">
  Belangrijke titel
</h1>

// Donkere gradient
<h2 className="gradient-text-brikx-dark">
  Subtitel
</h2>
```

### Icon Containers
```tsx
<div className="icon-container-brikx">
  <Icon className="w-5 h-5" />
</div>
```

### Glass Effect
```tsx
<div className="glass-effect-brikx">
  Semi-transparante content met blur
</div>
```

### Hover Effects
```tsx
// Lift effect (card omhoog bij hover)
<div className="hover-lift">
  Content
</div>

// Scale effect (groter bij hover)
<button className="hover-scale">
  Click me
</button>
```

## Tailwind Utility Classes

### Border Radius
- `rounded-brikx` - 12px
- `rounded-brikx-lg` - 16px
- `rounded-brikx-xl` - 20px
- `rounded-brikx-2xl` - 24px

### Box Shadows
- `shadow-brikx` - Standaard Brikx shadow met teal kleur
- `shadow-brikx-lg` - Grotere Brikx shadow
- `shadow-brikx-xl` - Extra grote Brikx shadow
- `shadow-modern` - Moderne shadow zonder kleur
- `shadow-modern-lg` - Grotere moderne shadow
- `shadow-modern-xl` - Extra grote moderne shadow
- `shadow-inner-modern` - Inner shadow voor inset effect

### Backdrop Blur
- `backdrop-blur-brikx` - 8px blur effect

### Kleuren
- `bg-brikx-dark` - #0A2540
- `bg-brikx-teal` - #2D9CDB
- `bg-brikx-teal-dark` - #1D7AAC
- `bg-brikx-bg` - #F5F7FA
- `text-brikx-dark` - Donkere tekst
- `text-brikx-teal` - Teal tekst

## Animations

```tsx
// Slide in from left
<div className="animate-slideIn">
  Content
</div>

// Fade in
<div className="animate-fadeIn">
  Content
</div>

// Subtle pulse
<div className="animate-pulse-subtle">
  Content
</div>
```

## Badges

```tsx
<span className="badge-brikx badge-premium">Premium</span>
<span className="badge-brikx badge-success">Actief</span>
<span className="badge-brikx badge-warning">Let op</span>
<span className="badge-brikx badge-danger">Fout</span>
<span className="badge-brikx badge-draft">Concept</span>
```

## Voorbeeld: Complete Card

```tsx
<div className="card-brikx-modern-gradient hover-lift">
  <div className="flex items-center gap-3 mb-4">
    <div className="icon-container-brikx">
      <Plus className="w-5 h-5" />
    </div>
    <h3 className="gradient-text-brikx-dark">
      Voeg item toe
    </h3>
  </div>

  <p className="text-gray-600 mb-4">
    Beschrijving van de actie
  </p>

  <div className="flex gap-3">
    <input
      type="text"
      className="input-brikx flex-1"
      placeholder="Item naam..."
    />
    <button className="btn-brikx-primary">
      Toevoegen
    </button>
  </div>
</div>
```

## Best Practices

1. **Gebruik custom classes voor herhaalde patronen**
   - `card-brikx-modern` in plaats van handmatig alle Tailwind classes
   - `btn-brikx-primary` in plaats van lange button styling

2. **Combineer custom classes met Tailwind utilities**
   ```tsx
   <div className="card-brikx-modern p-6 mb-4">
     {/* Custom card styling + Tailwind spacing */}
   </div>
   ```

3. **Gebruik semantic classes**
   - `card-brikx-empty` voor lege states
   - `card-brikx-section` voor grote content secties
   - `card-brikx-interactive` voor klikbare items

4. **Consistent gebruik van kleuren**
   - Gebruik de gedefinieerde Brikx kleuren
   - Vermijd hardcoded hex values

5. **Responsive design**
   - Gebruik Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`
   - Test op verschillende schermgroottes

## Migratie van oude styling

Als je een component hebt met inline Tailwind classes, kun je deze vervangen:

**Oud:**
```tsx
<div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-5">
```

**Nieuw:**
```tsx
<div className="card-brikx-modern p-5">
```

**Oud:**
```tsx
<h1 className="text-xl font-bold bg-gradient-to-r from-brikx-teal to-blue-600 bg-clip-text text-transparent">
```

**Nieuw:**
```tsx
<h1 className="text-xl gradient-text-brikx">
```
