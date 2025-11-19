import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Clock, Users, Camera, Edit2 } from 'lucide-react';
import { useUpdateRecipe, useDeleteRecipe } from '../hooks';
import type { RecipeWithIngredients, RecipeIngredient, IngredientCategory } from '../types';
import { COMMON_TAGS } from '../utils';

interface RecipeDetailDialogProps {
    recipe: RecipeWithIngredients;
    isOpen: boolean;
    onClose: () => void;
}

export default function RecipeDetailDialog({ recipe, isOpen, onClose }: RecipeDetailDialogProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState<RecipeWithIngredients>(recipe);

    const updateRecipe = useUpdateRecipe();
    const deleteRecipe = useDeleteRecipe();

    useEffect(() => {
        setEditedRecipe(recipe);
        setIsEditing(false);
    }, [recipe, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            await updateRecipe.mutateAsync({
                id: editedRecipe.id,
                title: editedRecipe.title,
                default_servings: editedRecipe.default_servings,
                prep_time_min: editedRecipe.prep_time_min ?? undefined,
                instructions: editedRecipe.instructions || '',
                tags: editedRecipe.tags,
                image_url: editedRecipe.image_url || undefined,
                ingredients: editedRecipe.ingredients.map((ing, index) => ({
                    name: ing.name,
                    quantity: ing.quantity || undefined,
                    unit: ing.unit || undefined,
                    category: ing.category,
                    is_optional: ing.is_optional,
                    sort_order: index,
                })),
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update recipe:', error);
            alert('Opslaan mislukt');
        }
    };

    const handleDelete = async () => {
        if (confirm('Weet je zeker dat je dit recept wilt verwijderen?')) {
            try {
                await deleteRecipe.mutateAsync(recipe.id);
                onClose();
            } catch (error) {
                console.error('Failed to delete recipe:', error);
                alert('Verwijderen mislukt');
            }
        }
    };

    const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
        const newIngredients = [...editedRecipe.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
    };

    const addIngredient = () => {
        const newIngredient: RecipeIngredient = {
            id: `temp-${Date.now()}`,
            recipe_id: recipe.id,
            name: '',
            quantity: null,
            unit: null,
            category: 'other',
            is_optional: false,
            sort_order: editedRecipe.ingredients.length,
            created_at: new Date().toISOString(),
        };
        setEditedRecipe({
            ...editedRecipe,
            ingredients: [...editedRecipe.ingredients, newIngredient],
        });
    };

    const removeIngredient = (index: number) => {
        const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index);
        setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
    };

    const toggleTag = (tag: string) => {
        const currentTags = editedRecipe.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        setEditedRecipe({ ...editedRecipe, tags: newTags });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Afbeelding is te groot (max 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setEditedRecipe({ ...editedRecipe, image_url: base64String });
        };
        reader.readAsDataURL(file);
    };

    const handleCategoryChange = (category: string) => {
        // Remove existing category tags (starting with 'cat:')
        const otherTags = (editedRecipe.tags || []).filter(t => !t.startsWith('cat:'));
        // Add new category tag
        setEditedRecipe({ ...editedRecipe, tags: [...otherTags, `cat:${category}`] });
    };

    const currentCategory = (editedRecipe.tags || []).find(t => t.startsWith('cat:'))?.replace('cat:', '') || '';

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate flex-1 pr-4">
                        {isEditing ? 'Recept bewerken' : recipe.title}
                    </h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                    title="Bewerken"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    title="Verwijderen"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Image */}
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                                {editedRecipe.image_url ? (
                                    <img
                                        src={editedRecipe.image_url}
                                        alt={editedRecipe.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Camera className="w-12 h-12" />
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                                            Wijzig foto
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                {isEditing ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                                        <input
                                            type="text"
                                            value={editedRecipe.title}
                                            onChange={(e) => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal"
                                        />
                                    </div>
                                ) : null}

                                {/* Category Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['ontbijt', 'lunch', 'avond', 'toetje'].map((cat) => {
                                            const isSelected = currentCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => isEditing && handleCategoryChange(cat)}
                                                    disabled={!isEditing}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize ${isSelected
                                                        ? 'bg-brikx-teal text-white border-brikx-teal'
                                                        : 'bg-white text-gray-700 border-gray-300'
                                                        } ${!isEditing && !isSelected ? 'opacity-50' : ''}`}
                                                >
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Clock className="w-4 h-4 inline mr-1" /> Bereidingstijd (min)
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editedRecipe.prep_time_min || ''}
                                                onChange={(e) => setEditedRecipe({ ...editedRecipe, prep_time_min: parseInt(e.target.value) || null })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{recipe.prep_time_min || '-'} min</p>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Users className="w-4 h-4 inline mr-1" /> Porties
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editedRecipe.default_servings}
                                                onChange={(e) => setEditedRecipe({ ...editedRecipe, default_servings: parseInt(e.target.value) || 2 })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{recipe.default_servings} personen</p>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {isEditing ? (
                                            COMMON_TAGS.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => toggleTag(tag)}
                                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${editedRecipe.tags.includes(tag)
                                                        ? 'bg-brikx-teal text-white border-brikx-teal'
                                                        : 'bg-white text-gray-600 border-gray-300'
                                                        }`}
                                                >
                                                    {tag}
                                                </button>
                                            ))
                                        ) : (
                                            recipe.tags.filter(t => !t.startsWith('cat:')).map(tag => (
                                                <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                    {tag}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Ingredients */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Ingrediënten</h3>
                                    {isEditing && (
                                        <button
                                            onClick={addIngredient}
                                            className="text-sm text-brikx-teal hover:text-brikx-teal-dark flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Toevoegen
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {editedRecipe.ingredients.map((ing, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="number"
                                                        placeholder="Hvh"
                                                        value={ing.quantity || ''}
                                                        onChange={(e) => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || null)}
                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Eenheid"
                                                        value={ing.unit || ''}
                                                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Ingrediënt"
                                                        value={ing.name}
                                                        onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                    <button
                                                        onClick={() => removeIngredient(idx)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-baseline gap-2 text-sm text-gray-700 py-1 border-b border-gray-50 w-full">
                                                    <span className="font-medium w-16 text-right">
                                                        {ing.quantity} {ing.unit}
                                                    </span>
                                                    <span>{ing.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {editedRecipe.ingredients.length === 0 && (
                                        <p className="text-sm text-gray-400 italic">Geen ingrediënten</p>
                                    )}
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Bereiding</h3>
                                {isEditing ? (
                                    <textarea
                                        value={editedRecipe.instructions || ''}
                                        onChange={(e) => setEditedRecipe({ ...editedRecipe, instructions: e.target.value })}
                                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal font-sans"
                                        placeholder="Stap 1..."
                                    />
                                ) : (
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {recipe.instructions || 'Geen instructies'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {isEditing && (
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={() => {
                                setEditedRecipe(recipe);
                                setIsEditing(false);
                            }}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                        >
                            Annuleren
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateRecipe.isPending}
                            className="px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark flex items-center gap-2"
                        >
                            {updateRecipe.isPending ? 'Opslaan...' : <><Save className="w-4 h-4" /> Opslaan</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
