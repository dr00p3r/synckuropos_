export const comboProductSchema = {
    keyCompression: true,
    version: 0,
    title: 'Combo Products Schema in RxDB',
    primaryKey: 'comboProductId',
    type: 'object',
    properties: {
        comboProductId: {
            type: 'string',
            maxLength: 38
        },
        productId: {
            type: 'string',
            maxLength: 38
        },
        comboQuantity: {
            type: 'number',
        },
        comboPrice: {
            type: 'integer',
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
        'comboProductId',
        'productId',
        'comboQuantity',
        'comboPrice',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['productId', 'isActive']
};