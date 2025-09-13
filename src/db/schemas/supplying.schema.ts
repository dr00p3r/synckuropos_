export const supplyingSchema = {
    keyCompression: true,
    version: 0,
    title: 'Supplies Schema in RxDB',
    primaryKey: 'supplyingId',
    type: 'object',
    properties: {
        supplyingId: {
            type: 'string',
            maxLength: 38
        },
        supplierName: {
            type: 'string',
        },
        productId: {
            type: 'string',
            maxLength: 38
        },
        unitCost: {
            type: 'integer',
        },
        quantity: {
            type: 'number',
        },
        reason: {
            type: 'string',
        },
        supplyDate: {
            type: 'string',
            maxLength: 64,
            format: 'date-time'
        },
        isActive: {
            type: 'boolean',
            default: true
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: [
        'supplyingId',
        'productId',
        'unitCost',
        'quantity',
        'supplyDate',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['productId', 'supplyDate', 'isActive']
};