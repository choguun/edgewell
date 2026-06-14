// Hand-rolled JSON-schema-like validator. Supports a subset that is
// enough for our own records: type, required, properties, items,
// enum, minimum/maximum, minLength/maxLength, pattern.

export type SchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object"
  | "null"
  | "any";

export interface StringSchema {
  type: "string";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
}

export interface NumberSchema {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
}

export interface ObjectSchema {
  type: "object";
  required?: string[];
  properties?: Record<string, SchemaNode>;
}

export interface ArraySchema {
  type: "array";
  minItems?: number;
  maxItems?: number;
  items?: SchemaNode;
}

export interface SimpleSchema {
  type: "boolean" | "null" | "any";
  enum?: unknown[];
}

export type TypedSchema = StringSchema | NumberSchema | ObjectSchema | ArraySchema | SimpleSchema;

export interface EnumOnlySchema {
  enum: unknown[];
}

export interface AnyOfSchema {
  anyOf: SchemaNode[];
}

export type SchemaNode = TypedSchema | EnumOnlySchema | AnyOfSchema;

export class ValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(`validation failed: ${errors.join("; ")}`);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

function checkType(value: unknown, type: SchemaType): boolean {
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

function isAnyOf(s: SchemaNode): s is AnyOfSchema {
  return "anyOf" in s && Array.isArray((s as AnyOfSchema).anyOf);
}

function isEnumOnly(s: SchemaNode): s is EnumOnlySchema {
  return "enum" in s && !("type" in s);
}

function validate(value: unknown, schema: SchemaNode, path: string, errors: string[]): void {
  if (isAnyOf(schema)) {
    let ok = false;
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

  if (isEnumOnly(schema)) {
    if (!schema.enum.includes(value as never)) {
      errors.push(`${path}: must be one of ${JSON.stringify(schema.enum)}`);
    }
    return;
  }

  // TypedSchema: discriminated by `type`.
  const s = schema as TypedSchema;
  if (s.type && !checkType(value, s.type)) {
    errors.push(`${path}: expected ${s.type}, got ${value === null ? "null" : typeof value}`);
    return;
  }
  if ("enum" in s && s.enum && !s.enum.includes(value as never)) {
    errors.push(`${path}: must be one of ${JSON.stringify(s.enum)}`);
  }
  if (s.type === "string" && typeof value === "string") {
    if (s.minLength != null && value.length < s.minLength) {
      errors.push(`${path}: shorter than minLength ${s.minLength}`);
    }
    if (s.maxLength != null && value.length > s.maxLength) {
      errors.push(`${path}: longer than maxLength ${s.maxLength}`);
    }
    if (s.pattern && !new RegExp(s.pattern).test(value)) {
      errors.push(`${path}: does not match pattern ${s.pattern}`);
    }
  }
  if ((s.type === "number" || s.type === "integer") && typeof value === "number") {
    if (s.minimum != null && value < s.minimum) {
      errors.push(`${path}: below minimum ${s.minimum}`);
    }
    if (s.maximum != null && value > s.maximum) {
      errors.push(`${path}: above maximum ${s.maximum}`);
    }
  }
  if (s.type === "object" && value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const req of s.required ?? []) {
      if (!(req in obj)) errors.push(`${path}.${req}: required`);
    }
    for (const [k, sub] of Object.entries(s.properties ?? {})) {
      if (k in obj) validate(obj[k], sub, `${path}.${k}`, errors);
    }
  }
  if (s.type === "array" && Array.isArray(value)) {
    if (s.minItems != null && value.length < s.minItems) {
      errors.push(`${path}: fewer than minItems ${s.minItems}`);
    }
    if (s.maxItems != null && value.length > s.maxItems) {
      errors.push(`${path}: more than maxItems ${s.maxItems}`);
    }
    if (s.items) {
      value.forEach((v, i) => validate(v, s.items as SchemaNode, `${path}[${i}]`, errors));
    }
  }
}

export function validateRecord<T = unknown>(value: unknown, schema: SchemaNode): T {
  const errors: string[] = [];
  validate(value, schema, "$", errors);
  if (errors.length) throw new ValidationError(errors);
  return value as T;
}
