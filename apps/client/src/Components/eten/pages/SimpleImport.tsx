// src/Components/eten/pages/SimpleImport.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface RecipeJSON {
    title: string;
    ingredients: Array<{
        name: string;
        quantity?: number;
        unit?: string;
        category?: string;
    }>;
    instructions: string;
    prepTime?: number;
    servings?: number;
    tags?: string[];
}

export default function SimpleImport() {
    const navigate = useNavigate();
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleImport = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const recipeData: RecipeJSON = JSON.parse(jsonInput);

            if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
                throw new Error('JSON moet title, ingredients en instructions bevatten');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: recipe, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    user_id: user.id,
                    title: recipeData.title,
                    source_type: 'import',
                    default_servings: recipeData.servings || 2,
                    prep_time_min: recipeData.prepTime,
                    instructions: recipeData.instructions,
                    tags: recipeData.tags || [],
                })
                .select()
                .single();

            if (recipeError) throw recipeError;

            if (recipeData.ingredients.length > 0) {
                const { error: ingredientsError } = await supabase
                    .from('recipe_ingredients')
                    .insert(
                        recipeData.ingredients.map((ing, index) => ({
                            recipe_id: recipe.id,
                            name: ing.name,
                            quantity: ing.quantity || 0,
                            unit: ing.unit || 'stuk',
                            category: ing.category || 'other',
                            sort_order: index,
                        }))
                    );

                if (ingredientsError) throw ingredientsError;
            }

            setSuccess(`Recept "${recipe.title}" succesvol geïmporteerd!`);
            setTimeout(() => navigate('/recepten'), 2000);
        } catch (err: any) {
            setError(err.message || 'Fout bij importeren');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Recept Importeren (JSON)</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">JSON Format</h2>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto mb-4">
                        {`{
  "title": "Spaghetti Carbonara",
  "servings": 4,
  "prepTime": 30,
  "tags": ["pasta", "italiaans"],
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": 400,
      "unit": "gram",
      "category": "pantry"
    },
    {
      "name": "eieren",
      "quantity": 4,
      "unit": "stuk",
      "category": "dairy"
    }
  ],
  "instructions": "Kook de pasta. Klop de eieren..."
}`}
                    </pre>

                    <label className="block mb-2 font-medium">Plak JSON hier:</label>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full h-64 p-4 border rounded font-mono text-sm"
                        placeholder="Plak je recept JSON hier..."
                    />

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
                            {success}
                        </div>
                    )}

                    <button
                        onClick={handleImport}
                        disabled={loading || !jsonInput.trim()}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Importeren...' : 'Importeer Recept'}
                    </button>
                </div>
            </div>
        </div>
    );
}
