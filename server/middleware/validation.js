/**
 * Zod Request Body Validation Middleware
 * Validates req.body against a given Zod schema.
 * Rejects invalid payloads with a 400 Bad Request conforming to the structured error envelope.
 * Attaches the parsed/sanitized data to req.validatedBody.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const fieldPath = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'body';
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `${fieldPath}: ${firstIssue.message}`,
          details: result.error.format(),
        },
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
