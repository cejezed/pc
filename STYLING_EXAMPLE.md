# Styling Voorbeeld: Boodschappen Pagina Refactor

## Voordat (met inline Tailwind)

```tsx
{/* Week Navigation - OUD */}
<div className="flex items-center justify-between bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4 sm:p-5 print:hidden backdrop-blur-sm">
  <button
    onClick={handlePrevWeek}
    className="p-2.5 hover:bg-gradient-to-r hover:from-brikx-teal/10 hover:to-blue-50 rounded-xl transition-all hover:scale-105"
  >
    <ChevronLeft className="w-5 h-5 text-gray-700" />
  </button>

  <div className="text-center">
    <p className="font-bold text-lg bg-gradient-to-r from-brikx-teal to-blue-600 bg-clip-text text-transparent">
      {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
    </p>
  </div>

  <button
    onClick={handleNextWeek}
    className="p-2.5 hover:bg-gradient-to-r hover:from-brikx-teal/10 hover:to-blue-50 rounded-xl transition-all hover:scale-105"
  >
    <ChevronRight className="w-5 h-5 text-gray-700" />
  </button>
</div>
```

## Na (met centralized classes)

```tsx
{/* Week Navigation - NIEUW */}
<div className="card-brikx-modern flex items-center justify-between print:hidden">
  <button
    onClick={handlePrevWeek}
    className="p-2.5 rounded-xl hover-scale hover:bg-brikx-teal/10 transition-colors"
  >
    <ChevronLeft className="w-5 h-5 text-gray-700" />
  </button>

  <div className="text-center">
    <p className="text-lg gradient-text-brikx">
      {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
    </p>
  </div>

  <button
    onClick={handleNextWeek}
    className="p-2.5 rounded-xl hover-scale hover:bg-brikx-teal/10 transition-colors"
  >
    <ChevronRight className="w-5 h-5 text-gray-700" />
  </button>
</div>
```

**Voordelen:**
- 50% minder code
- Duidelijkere intentie (`card-brikx-modern`, `gradient-text-brikx`)
- Makkelijker te onderhouden
- Consistente styling door heel de app

---

## Voordat: Add Item Section

```tsx
{/* Add Manual Item - OUD */}
<div className="bg-gradient-to-br from-brikx-teal/5 via-blue-50/80 to-purple-50/60 rounded-2xl border border-brikx-teal/20 p-5 sm:p-7 print:hidden shadow-xl shadow-brikx-teal/10 backdrop-blur-sm">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-gradient-to-br from-brikx-teal to-blue-500 rounded-xl shadow-lg">
      <Plus className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
      Voeg item toe aan je lijst
    </h3>
  </div>
  <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
    Voeg handmatig items toe of plan maaltijden in de weekplanner
  </p>
  <div className="flex flex-col sm:flex-row gap-3">
    <input
      type="text"
      value={newItemName}
      onChange={(e) => setNewItemName(e.target.value)}
      placeholder="Wat moet je halen?"
      className="flex-1 px-5 py-3.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
    />
    <button
      onClick={() => addManualItem()}
      disabled={!newItemName.trim()}
      className="flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-brikx-teal to-blue-500 text-white rounded-xl hover:from-brikx-teal/90 hover:to-blue-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
    >
      <Plus className="w-5 h-5" />
      <span>Toevoegen</span>
    </button>
  </div>
</div>
```

## Na: Add Item Section

```tsx
{/* Add Manual Item - NIEUW */}
<div className="card-brikx-modern-gradient print:hidden">
  <div className="flex items-center gap-3 mb-4">
    <div className="icon-container-brikx">
      <Plus className="w-5 h-5" />
    </div>
    <h3 className="text-lg sm:text-xl gradient-text-brikx-dark">
      Voeg item toe aan je lijst
    </h3>
  </div>

  <p className="text-xs sm:text-sm text-gray-600 mb-5">
    Voeg handmatig items toe of plan maaltijden in de weekplanner
  </p>

  <div className="flex flex-col sm:flex-row gap-3">
    <input
      type="text"
      value={newItemName}
      onChange={(e) => setNewItemName(e.target.value)}
      placeholder="Wat moet je halen?"
      className="input-brikx flex-1 glass-effect-brikx"
    />
    <button
      onClick={() => addManualItem()}
      disabled={!newItemName.trim()}
      className="btn-brikx-primary hover-scale"
    >
      <Plus className="w-5 h-5" />
      <span>Toevoegen</span>
    </button>
  </div>
</div>
```

**Voordelen:**
- 60% minder code
- Alle complexe gradients en shadows in CSS classes
- Herbruikbare styling voor andere paginas
- Makkelijker te testen en debuggen

---

## Voordat: Empty State

```tsx
{/* Empty State - OUD */}
<div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300 p-12 sm:p-16 text-center shadow-inner">
  <div className="text-7xl mb-6 animate-pulse">🛒</div>
  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
    Je boodschappenlijst is leeg
  </h3>
  <p className="text-gray-600 mb-5 max-w-md mx-auto leading-relaxed">
    Voeg items toe met het formulier hierboven
  </p>
</div>
```

## Na: Empty State

```tsx
{/* Empty State - NIEUW */}
<div className="card-brikx-empty">
  <div className="text-7xl mb-6 animate-pulse-subtle">🛒</div>
  <h3 className="text-2xl gradient-text-brikx-dark mb-3">
    Je boodschappenlijst is leeg
  </h3>
  <p className="text-gray-600 mb-5 max-w-md mx-auto">
    Voeg items toe met het formulier hierboven
  </p>
</div>
```

**Voordelen:**
- 40% minder code
- Consistente empty state styling
- Aangepaste animatie voor deze use case

---

## Category Section Voorbeeld

```tsx
{/* Category - NIEUW */}
<div className="card-brikx-section hover-lift">
  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
    <span>{getCategoryEmoji(category)}</span>
    <span>{getCategoryLabel(category)}</span>
    <span className="badge-brikx badge-success ml-auto">
      {items.length}
    </span>
  </h3>

  <div className="space-y-2">
    {items.map((item, idx) => (
      <div
        key={idx}
        className="card-brikx-interactive flex items-center gap-3"
      >
        <input
          type="checkbox"
          checked={checkedItems.has(itemKey(item))}
          onChange={() => toggleItem(itemKey(item))}
          className="w-5 h-5 text-brikx-teal rounded"
        />
        <span className={`flex-1 ${
          checkedItems.has(itemKey(item)) ? 'line-through text-gray-400' : ''
        }`}>
          {item.name}
        </span>
      </div>
    ))}
  </div>
</div>
```

---

## Dashboard Card Voorbeeld

```tsx
{/* Dashboard Card - NIEUW */}
<div className="card-brikx-modern">
  <h3 className="gradient-text-brikx mb-4">
    Dagelijkse Check-in
  </h3>

  {/* Score Selector */}
  <div className="space-y-4">
    {/* Scores here */}
  </div>

  <button className="btn-brikx-primary w-full hover-lift">
    Check-in Opslaan
  </button>
</div>
```

---

## Samenvatting

### Code Reductie
- **Week Navigation**: 50% minder code
- **Add Item Section**: 60% minder code
- **Empty State**: 40% minder code
- **Gemiddeld**: ~50% minder code

### Onderhoudbaarheid
- ✅ Centrale styling definitions
- ✅ Makkelijk aan te passen (1 plaats)
- ✅ Consistentie door hele app
- ✅ Betere developer experience
- ✅ Minder bugs door hergebruik

### Performance
- ✅ Kleinere bundle size (CSS hergebruik)
- ✅ Betere caching
- ✅ Sneller renderen

### Next Steps

1. Refactor bestaande components met deze nieuwe classes
2. Verwijder oude inline styling
3. Test op alle pagina's
4. Documenteer custom classes voor team
