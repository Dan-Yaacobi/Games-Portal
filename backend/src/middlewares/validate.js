export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        issues: result.error.issues
      });
    }

    req[source] = result.data;
    return next();
  };
}
