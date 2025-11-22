# Theme Configuration Guide

## Centralized Theme System

All theme colors are now defined in **one place**: `tailwind.config.js`

### How to Use

Instead of using custom classes like `bg-zeus-primary` or `text-zeus-accent`, use semantic color names:

```tsx
// ❌ Old way (scattered custom classes)
<div className="bg-zeus-primary text-zeus-text border-zeus-border">

// ✅ New way (centralized semantic colors)
<div className="bg-primary text-text border-border">
```

### Available Color Classes

#### Primary Colors (Brand)
- `bg-primary` / `text-primary` / `border-primary`
- `bg-primary-light` / `bg-primary-dark`

#### Accent Colors (Interactive)
- `bg-accent` / `text-accent` / `border-accent`
- `bg-accent-light` / `bg-accent-dark`

#### Background Colors
- `bg-background` - Main page background
- `bg-background-secondary` - Cards, panels
- `bg-background-tertiary` - Subtle backgrounds

#### Border Colors
- `border-border` - Default borders
- `border-border-light` / `border-border-dark`

#### Text Colors
- `text-text` - Main text
- `text-text-secondary` - Secondary text
- `text-text-tertiary` - Tertiary text
- `text-text-inverse` - Text on dark backgrounds

### Changing the Theme

To change the entire app's theme, just edit the colors in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    DEFAULT: '#0F172A',  // Change this to update primary color everywhere
  },
  accent: {
    DEFAULT: '#14B8A6',  // Change this to update accent color everywhere
  },
  // ...
}
```

### Migration Examples

| Old Class | New Class |
|-----------|-----------|
| `bg-zeus-primary` | `bg-primary` |
| `text-zeus-accent` | `text-accent` |
| `bg-zeus-card` | `bg-background-secondary` |
| `border-zeus-border` | `border-border` |
| `text-zeus-text` | `text-text` |
| `text-zeus-text-secondary` | `text-text-secondary` |

### Benefits

1. **Single source of truth** - Change theme colors in one place
2. **Semantic naming** - `bg-primary` is clearer than `bg-zeus-primary`
3. **No CSS variables needed** - Everything in Tailwind config
4. **Easy theme switching** - Just swap the color values
5. **Better autocomplete** - Standard Tailwind pattern
