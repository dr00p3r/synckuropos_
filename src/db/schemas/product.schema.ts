export const productSchema = {
    keyCompression: true,
    version: 0,
    title: 'Products Schema in RxDB',
    primaryKey: 'productId',
    type: 'object',
    properties: {
        productId: {
            type: 'string',
            maxLength: 32
        },
        code: {
            type: 'string',
        },
        name: {
            type: 'string'
        },
        stock: {
            type: 'number'
        },
        basePrice: {
            type: 'integer'
        },
        allowDecimalQuantity: {
            type: 'boolean',
            default: false
        },
        isTaxable: {
            type: 'boolean'
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
        'productId',
        'code',
        'name',
        'stock',
        'basePrice',
        'isTaxable',
        'allowDecimalQuantity',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['code', 'name', 'isActive']
};