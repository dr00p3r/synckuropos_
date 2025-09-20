export const saleSchema = {
    keyCompression: true,
    version: 0,
    title: 'Sales Schema in RxDB',
    primaryKey: 'saleId',
    type: 'object',
    properties: {
        saleId: {
            type: 'string',
            maxLength: 38
        },
        userId: {
            type: 'string',
            maxLength: 38
        },
        customerId: {
            type: 'string',
            maxLength: 38
        },
        totalAmount: {
            type: 'integer',
        },
        isActive: {
            type: 'boolean',
            default: true
        },
        _deleted: {
            type: 'boolean',
            default: false
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
