export const saleSchema = {
    keyCompression: true,
    version: 0,
    title: 'Sales Schema in RxDB',
    primaryKey: 'saleId',
    type: 'object',
    properties: {
        saleId: {
            type: 'string',
            maxLength: 32
        },
        userId: {
            type: 'string',
        },
        customerId: {
            type: 'string',
        },
        totalAmount: {
            type: 'integer',
        },
        isActive: {
            type: 'boolean',
            default: true
        },
        isPartOfDebt: {
            type: 'boolean',
            default: false
        },
        SRIStatus: {
            type: 'string',
            enum: ['pending', 'uploaded', 'rejected', 'accepted'],
            default: 'pending'
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
        'saleId',
        'userId',
        'customerId',
        'totalAmount',
        'isActive',
        'isPartOfDebt',
        'SRIStatus',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['userId', 'customerId', 'isActive']
};
