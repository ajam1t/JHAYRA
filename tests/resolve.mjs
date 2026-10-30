// Lets Node run the app's ES modules, which import siblings without a file
// extension (Vite resolves those): try .js, then .jsx.
export async function resolve(spec, ctx, next) {
  try {
    return await next(spec, ctx);
  } catch (e) {
    if (!spec.startsWith('.') || /\.[a-z]+$/.test(spec)) throw e;
    for (const ext of ['.js', '.jsx']) {
      try {
        return await next(spec + ext, ctx);
      } catch {}
    }
    throw e;
  }
}
