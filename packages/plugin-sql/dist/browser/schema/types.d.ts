/**
 * Represents a custom type for converting a string to a JSONB format and vice versa.
 * @param {Object} options - The options for the custom type.
 * @param {Function} options.dataType - A function that returns the data type as "jsonb".
 * @param {Function} options.toDriver - A function that converts a string to a JSON string.
 * @param {Function} options.fromDriver - A function that converts a JSON string back to a string.
 * @returns {Object} - The custom type for string to JSONB conversion.
 */
export declare const stringJsonb: {
    (): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: string;
        driverParam: string;
        enumValues: undefined;
    }>;
    <TConfig extends Record<string, any>>(fieldConfig?: TConfig | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: string;
        driverParam: string;
        enumValues: undefined;
    }>;
    <TName extends string>(dbName: TName, fieldConfig?: unknown): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: TName;
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: string;
        driverParam: string;
        enumValues: undefined;
    }>;
};
/**
 * Represents a custom type for converting a number to a timestamp string and vice versa.
 * @param {Object} options - The options for the custom type.
 * @param {Function} options.dataType - A function that returns the data type as "timestamptz".
 * @param {Function} options.toDriver - A function that converts a number to a timestamp string using the Date object's toISOString method.
 * @param {Function} options.fromDriver - A function that converts a timestamp string to a number using the Date object's getTime method.
 * @returns {Object} - The custom type for number to timestamp conversion.
 */
export declare const numberTimestamp: {
    (): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: number;
        driverParam: string;
        enumValues: undefined;
    }>;
    <TConfig extends Record<string, any>>(fieldConfig?: TConfig | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: number;
        driverParam: string;
        enumValues: undefined;
    }>;
    <TName extends string>(dbName: TName, fieldConfig?: unknown): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        name: TName;
        dataType: "custom";
        columnType: "PgCustomColumn";
        data: number;
        driverParam: string;
        enumValues: undefined;
    }>;
};
