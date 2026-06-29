import { createClient } from './supabase/server'

export async function getStoreId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_members')
    .select('store_id')
    .limit(1)
    .single()
  return data?.store_id ?? null
}
