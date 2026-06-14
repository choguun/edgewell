// Hand-rolled JSON-schema-like validator. Supports a subset that is
// enough for our own records: type, required, properties, items,
// enum, minimum/maximum, minLength/maxLength, pattern.

export class ValidationError extends Error {
  constructor(errors) {
    super(`validation failed: ${errors.join("; ")}`);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

function checkType(value, type) {
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "null") return value === null;
  if (type === "any") return true;
  return false;
}

function validate(value, schema, path = "$", errors = []) {
  if (schema == null || typeof schema !== "object") {
    errors.push(`${path}: schema is missing or not an object`);
    return;
  }
  if (schema.anyOf) {
    let ok = false;
    const sub = [];
    for (const branch of schema.anyOf) {
      const before = errors.length;
      validate(value, branch, path, errors);
      if (errors.length === before) {
        ok = true;
        break;
      } else {
        errors.splice(before);
      }
    }
    if (!ok) errors.push(`${path}: no anyOf branch matched`);
    return;
  }

  if (schema.type && !checkType(value, schema.type)) {
    errors.push(`${path}: expected ${schema.type}, got ${value === null ? "null" : typeof value}`);
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (schema.type === "string") {
    if (schema.minLength != null && value.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if (schema.maxLength != null && value.length > schema.maxLength) {
      errors.push(`${path}: longer than maxLength ${schema.maxLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: does not match pattern ${schema.pattern}`);
    }
  }
  if (schema.type === "number" || schema.type === "integer") {
    if (schema.minimum != null && value < schema.minimum) {
      errors.push(`${path}: below minimum ${schema.minimum}`);
    }
    if (schema.maximum != null && value > schema.maximum) {
      errors.push(`${path}: above maximum ${schema.maximum}`);
    }
  }
  if (schema.type === "object" && value && typeof value === "object") {
    for (const req of schema.required ?? []) {
      if (!(req in value)) errors.push(`${path}.${req}: required`);
    }
    for (const [k, sub] of Object.entries(schema.properties ?? {})) {
      if (k in value) validate(value[k], sub, `${path}.${k}`, errors);
    }
  }
  if (schema.type === "array" && Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) {
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if (schema.maxItems != null && value.length > schema.maxItems) {
      errors.push(`${path}: more than maxItems ${schema.maxItems}`);
    }
    if (schema.items) {
      value.forEach((v, i) => validate(v, schema.items, `${path}[${i}]`, errors));
    }
  }
}

export function validateRecord(value, schema) {
  const errors = [];
  validate(value, schema, "$", errors);
  if (errors.length) throw new ValidationError(errors);
  return value;
}
