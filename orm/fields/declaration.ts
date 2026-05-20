type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Number
 */
type NumberField<CanBeNull extends boolean> = {
  type: 'integer';
  canBeNull: CanBeNull;
  default: number | null;
  primaryKey: boolean;
  autoIncrement: boolean;
};

type NumberOptions<CanBeNull> = {
  canBeNull?: CanBeNull;
  default?: number | null;
  primaryKey?: boolean;
  autoIncrement?: boolean;
};

export function number(
  options: Prettify<NumberOptions<false>>
): NumberField<false>;
export function number(
  options: Prettify<NumberOptions<true>>
): NumberField<true>;
export function number(
  options: NumberOptions<boolean>
): NumberField<false> | NumberField<true> {
  return {
    type: 'integer',
    canBeNull: options.canBeNull || false,
    default: options.default || null,
    primaryKey: options.primaryKey || false,
    autoIncrement: options.autoIncrement || false,
  };
}

/**
 * String
 */
type StringField<CanBeNull extends boolean> = {
  type: 'string';
  maxLength: number;
  canBeNull: CanBeNull;
  default: string | null;
  primaryKey: boolean;
};

type StringOptions<CanBeNull> = {
  maxLength: number;
  canBeNull?: CanBeNull;
  default?: string | null;
  primaryKey?: boolean;
};

export function string(
  options: Prettify<StringOptions<false>>
): StringField<false>;
export function string(
  options: Prettify<StringOptions<true>>
): StringField<true>;
export function string(
  options: StringOptions<boolean>
): StringField<false> | StringField<true> {
  return {
    type: 'string',
    maxLength: options.maxLength,
    canBeNull: options.canBeNull || false,
    default: options.default || null,
    primaryKey: options.primaryKey || false,
  };
}

/**
 * Boolean
 */
type BooleanField<CanBeNull extends boolean> = {
  type: 'boolean';
  canBeNull: CanBeNull;
  default: boolean | null;
  primaryKey: boolean;
};

type BooleanOptions<CanBeNull> = {
  canBeNull?: CanBeNull;
  default?: boolean | null;
  primaryKey?: boolean;
};

export function boolean(
  options: Prettify<BooleanOptions<false>>
): BooleanField<false>;
export function boolean(
  options: Prettify<BooleanOptions<true>>
): BooleanField<true>;
export function boolean(
  options: BooleanOptions<boolean>
): BooleanField<false> | BooleanField<true> {
  return {
    type: 'boolean',
    canBeNull: options.canBeNull || false,
    default: options.default || null,
    primaryKey: options.primaryKey || false,
  };
}

/**
 * Enumerated
 */
type EnumeratedField<T extends string, canBeNull extends boolean> = {
  type: 'enumerated';
  values: T[];
  canBeNull: canBeNull;
  default: string | null;
  primaryKey: boolean;
};

type EnumeratedOptions<T, CanBeNull> = {
  values: T[];
  canBeNull?: CanBeNull;
  default?: string | null;
  primaryKey?: boolean;
};

export function enumerated<T extends string>(
  options: Prettify<EnumeratedOptions<T, false>>
): EnumeratedField<T, false>;
export function enumerated<T extends string>(
  options: Prettify<EnumeratedOptions<T, true>>
): EnumeratedField<T, true>;
export function enumerated<T extends string>(
  options: EnumeratedOptions<T, boolean>
): EnumeratedField<T, false> | EnumeratedField<T, true> {
  return {
    type: 'enumerated',
    values: options.values,
    canBeNull: options.canBeNull || false,
    default: options.default || null,
    primaryKey: options.primaryKey || false,
  };
}

/**
 * DateTime
 */
type DateTimeField<CanBeNull extends boolean> = {
  type: 'datetime';
  canBeNull: CanBeNull;
  default: Date | null;
  primaryKey: boolean;
};

type DateOptions<CanBeNull> = {
  canBeNull?: CanBeNull;
  default?: Date | null;
  primaryKey?: boolean;
};

export function dateTime(
  options: Prettify<DateOptions<false>>
): DateTimeField<false>;
export function dateTime(
  options: Prettify<DateOptions<true>>
): DateTimeField<true>;
export function dateTime(
  options: DateOptions<boolean>
): DateTimeField<false> | DateTimeField<true> {
  return {
    type: 'datetime',
    canBeNull: options.canBeNull || false,
    default: options.default || null,
    primaryKey: options.primaryKey || false,
  };
}

/**
 * Any Field
 */
export type AnyField =
  | NumberField<true>
  | NumberField<false>
  | StringField<true>
  | StringField<false>
  | BooleanField<true>
  | BooleanField<false>
  | EnumeratedField<any, true>
  | EnumeratedField<any, false>
  | DateTimeField<true>
  | DateTimeField<false>;

export type Fields = {
  [key: string]: AnyField;
};

export const resolveField = (
  fields: Fields,
  fieldName: string,
  tableName: string
): AnyField => {
  const field = fields[fieldName];
  if (!field) {
    throw new Error(
      `Unknown field "${fieldName}" on table "${tableName}": not declared in the schema. ` +
        `The TS declaration may be out of sync with the database (forgotten ALTER TABLE, ` +
        `stale declaration file, or typo in the field name).`
    );
  }
  return field;
};

type TypeOfField<Field> = Field extends NumberField<true>
  ? number | null
  : Field extends NumberField<false>
  ? number
  : Field extends StringField<true>
  ? string | null
  : Field extends StringField<false>
  ? string
  : Field extends BooleanField<true>
  ? boolean | null
  : Field extends BooleanField<false>
  ? boolean
  : Field extends EnumeratedField<any, true>
  ? Field['values'][number] | null
  : Field extends EnumeratedField<any, false>
  ? Field['values'][number]
  : Field extends DateTimeField<true>
  ? Date | null
  : Field extends DateTimeField<false>
  ? Date
  : never;

export type InferFromFields<Fields extends { [key: string]: AnyField }> = {
  [key in keyof Fields]: TypeOfField<Fields[key]>;
};
