import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, detectSessionInUrl: true },
});

export async function submitEnquiry(payload) {
  if (import.meta.env.VITE_PREVIEW) throw new Error('This is a preview, so the form does not send. On the live website it saves the enquiry.');
  const { data, error } = await supabase.functions.invoke('submit-enquiry', { body: payload });
  if (!error) return data;
  let message = 'We could not send your requirement right now. Please call or WhatsApp us.';
  let field;
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) message = body.error;
      field = body?.field;
    } catch { /* keep default message */ }
  }
  const err = new Error(message);
  err.field = field;
  throw err;
}
