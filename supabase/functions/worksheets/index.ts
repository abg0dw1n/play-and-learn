// Supabase edge function "worksheets": the parents-only API behind My Worksheets.
// Deployed with verify_jwt off — it does its own passcode sign-in (see core.js).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHandler } from './core.js';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const BUCKET = 'worksheets';
const ok = <T>(r: { data: T; error: unknown }): T => {
  if (r.error) throw r.error;
  return r.data;
};

const db = {
  async getSetting(key: string) {
    const r = ok(await supabase.from('settings').select('value').eq('key', key).maybeSingle());
    return r ? (r as { value: string }).value : null;
  },
  async setSetting(key: string, value: string) {
    ok(await supabase.from('settings').upsert({ key, value }));
  },
  async takeAttempt(nowMs: number, max: number, lockMs: number) {
    return ok(await supabase.rpc('take_attempt', { p_now: nowMs, p_max: max, p_lock_ms: lockMs })) as boolean;
  },
  async listWorksheets() {
    return ok(await supabase.from('worksheets').select('id,title,notes,created_at,updated_at').order('created_at', { ascending: false }));
  },
  async getWorksheet(id: string) {
    return ok(await supabase.from('worksheets').select('id,title,notes,created_at,updated_at').eq('id', id).maybeSingle());
  },
  async createWorksheet(row: { title: string }) {
    return ok(await supabase.from('worksheets').insert(row).select('id,title,notes,created_at,updated_at').single());
  },
  async updateWorksheet(id: string, fields: Record<string, string>) {
    return ok(await supabase.from('worksheets').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
      .select('id,title,notes,created_at,updated_at').single());
  },
  async touchWorksheet(id: string) {
    ok(await supabase.from('worksheets').update({ updated_at: new Date().toISOString() }).eq('id', id));
  },
  async deleteWorksheet(id: string) {
    ok(await supabase.from('worksheets').delete().eq('id', id));
  },
  async listPages(ids: string[]) {
    if (!ids.length) return [];
    return ok(await supabase.from('worksheet_pages').select('id,worksheet_id,position,path,kind,text').in('worksheet_id', ids)
      .order('position'));
  },
  async getPage(id: string) {
    return ok(await supabase.from('worksheet_pages').select('id,worksheet_id,position,path,kind,text').eq('id', id).maybeSingle());
  },
  async addPage(row: Record<string, unknown>) {
    return ok(await supabase.from('worksheet_pages').insert(row).select('id,worksheet_id,position,path,kind,text').single());
  },
  async deletePage(id: string) {
    ok(await supabase.from('worksheet_pages').delete().eq('id', id));
  },
};

const storage = {
  async upload(path: string, bytes: Uint8Array, contentType: string) {
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
    if (error) throw error;
  },
  async signedUrls(paths: string[], seconds: number) {
    const data = ok(await supabase.storage.from(BUCKET).createSignedUrls(paths, seconds)) as { path: string | null; signedUrl: string }[];
    return Object.fromEntries(data.filter((d) => d.path).map((d) => [d.path as string, d.signedUrl]));
  },
  async remove(paths: string[]) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) throw error;
  },
};

const handler = createHandler({
  db,
  storage,
  allowedOrigins: [
    'https://play-and-learn-pi.vercel.app',
    'http://localhost:8090',
    'http://localhost:8080',
    'http://127.0.0.1:8090',
  ],
});

Deno.serve(handler);
