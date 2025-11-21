import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UserIntegrations {
    user_id: string;
    google_calendar_ics: string | null;
    created_at: string;
    updated_at: string;
}

export function useIntegrations() {
    return useQuery({
        queryKey: ['user-integrations'],
        queryFn: async (): Promise<UserIntegrations | null> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data as UserIntegrations | null;
        },
    });
}

export function useSaveIntegrations() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (integrations: Partial<UserIntegrations>): Promise<UserIntegrations> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_integrations')
                .upsert({
                    user_id: user.id,
                    ...integrations,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data as UserIntegrations;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-integrations'] });
        },
    });
}
