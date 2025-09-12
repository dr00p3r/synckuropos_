export const saleDetailSchema = {
    keyCompression: true,
    version: 0,
    title: 'Sale Details Schema in RxDB',
    primaryKey: {
        key: 'saleDetailId',
        fields: ['saleId', 'productId'],
        separator: '_'
    },
    type: 'object',
    properties: {
        saleDetailId: {
            type: 'string',
            maxLength: 64
        },
        saleId: {
            type: 'string',
        },
        productId: {
            type: 'string',
        },
        quantity: {
            type: 'number',
        },
        unitPrice: {
            type: 'integer',
        },
        subtotal: {
            type: 'integer',
        },
        taxAmount: {
            type: 'integer',
        },
        lineTotal: {
            type: 'integer',
        }
    },
    required: [
        'saleDetailId',
        'saleId',
        'productId',
        'quantity',
        'unitPrice',
        'subtotal',
        'taxAmount',
        'lineTotal'
    ],
    indexes: ['saleId', 'productId']
};