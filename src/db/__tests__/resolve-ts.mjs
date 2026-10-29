/**
 * Metro resolves `./foo` to `foo.ts`; plain Node does not. This hook teaches
 * the test runner the same trick, so app code can keep its normal imports.
 */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
    try {
      return await next(specifier, context);
    } catch {
      return await next(`${specifier}.ts`, context);
    }
  }
  return next(specifier, context);
}
