export declare const serverAgentsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "server_agents";
    schema: undefined;
    columns: {
        serverId: import("drizzle-orm/pg-core").PgColumn<{
            name: "server_id";
            tableName: "server_agents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "agent_id";
            tableName: "server_agents";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
