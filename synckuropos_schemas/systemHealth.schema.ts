import {
    toTypedRxJsonSchema,
    type ExtractDocumentTypeFromTypedRxJsonSchema,
    type RxJsonSchema
} from 'rxdb';

export const systemHealthSchemaLiteral = {
    title: 'system health schema',
    description: 'Schema for storing system health and MTBF metrics',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        last_heartbeat: {
            type: 'number',
            minimum: 0,
            multipleOf: 1
        },
        last_failure_at: {
            type: 'number',
            minimum: 0,
            multipleOf: 1
        },
        total_uptime: {
            type: 'number',
            minimum: 0,
            multipleOf: 1
        },
        total_crashes: {
            type: 'number',
            minimum: 0,
            multipleOf: 1
        },
        current_status: {
            type: 'string',
            maxLength: 20
        },
        integrity_status: {
            type: 'string',
            maxLength: 20
        }
    },
    required: ['id', 'last_heartbeat', 'total_uptime', 'total_crashes', 'current_status']
} as const;

const schemaTyped = toTypedRxJsonSchema(systemHealthSchemaLiteral);
export type SystemHealthDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const systemHealthSchema: RxJsonSchema<SystemHealthDocType> = systemHealthSchemaLiteral;
