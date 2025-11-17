// src/features/eten/components/RecipeCard.tsx
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
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        {/* Favourite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite?.(recipe.id, !recipe.is_favourite);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              recipe.is_favourite
                ? 'fill-red-500 text-red-500'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
                className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
