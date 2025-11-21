// src/Components/eten/components/RecipeCard.tsx
import React from 'react';
import { Heart, Clock, Users } from 'lucide-react';
import type { Recipe } from '../types';
import { formatPrepTime, getTagColor } from '../utils';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onToggleFavourite?: (id: string, isFavourite: boolean) => void;
}

export function RecipeCard({ recipe, onClick, onToggleFavourite }: RecipeCardProps) {
  return (
    <div
      className="bg-[var(--zeus-card)] rounded-lg border border-[var(--zeus-border)] overflow-hidden hover:shadow-[0_0_20px_var(--zeus-primary-glow)] hover:border-[var(--zeus-primary)] transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-[var(--zeus-bg-secondary)]">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--zeus-text-secondary)]">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Favourite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite?.(recipe.id, !recipe.is_favourite);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${recipe.is_favourite
                ? 'fill-red-500 text-red-500'
                : 'text-[var(--zeus-text-secondary)] hover:text-white'
              }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-[var(--zeus-text)] mb-2 line-clamp-2 group-hover:text-[var(--zeus-primary)] transition-colors">
          {recipe.title}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-[var(--zeus-text-secondary)] mb-3">
          {recipe.prep_time_min && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatPrepTime(recipe.prep_time_min)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.default_servings} pers.</span>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2 py-0.5 rounded-full border border-[var(--zeus-border)] bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)]`}
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)]">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
