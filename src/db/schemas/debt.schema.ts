export const debtSchema = {
    keyCompression: true,
    version: 0,
    title: 'Customer Debts Schema in RxDB',
    primaryKey: 'debtId',
    type: 'object',
    properties: {
        debtId: {
            type: 'string',
            maxLength: 32
        },
        customerId: {
            type: 'string',
        },
        amount: {
            type: 'integer',
            default: 0
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
        'debtId',
        'customerId',
        'amount',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['customerId']
};