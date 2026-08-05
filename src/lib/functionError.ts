// supabase.functions.invoke(): при не-2xx відповіді supabase-js кладе
// помилку в `error` (FunctionsHttpError), а `data` стає null — реальний
// текст лежить у error.context (Response), його треба прочитати окремо.
// Той самий хелпер, що й у мобільному застосунку.
export async function getFunctionErrorMessage(error: unknown, data: any, fallback: string): Promise<string> {
  if (data?.error) return String(data.error);

  const err = error as { context?: Response; message?: string } | null | undefined;
  if (err?.context && typeof err.context.json === 'function') {
    try {
      const body = await err.context.json();
      if (body?.error) return String(body.error);
    } catch {
      // тіло не JSON або вже прочитане
    }
  }

  return err?.message ?? fallback;
}
