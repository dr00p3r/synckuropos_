import {
    toTypedRxJsonSchema,
    type ExtractDocumentTypeFromTypedRxJsonSchema,
    type RxJsonSchema
} from 'rxdb';

export const telemetrySchemaLiteral = {
    title: 'telemetry schema',
    description: 'Schema for storing telemetry logs',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        timestamp: {
            type: 'number',
            minimum: 0,
            multipleOf: 1
        },
        type: {
            type: 'string',
            maxLength: 50
        },
        data: {
            type: 'object'
        },
        isSynced: {
            type: 'boolean'
        }
    },
    required: ['id', 'timestamp', 'type', 'data', 'isSynced']
} as const;

const schemaTyped = toTypedRxJsonSchema(telemetrySchemaLiteral);
export type TelemetryDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const telemetrySchema: RxJsonSchema<TelemetryDocType> = telemetrySchemaLiteral;
