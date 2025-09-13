export const debtPaymentSchema = {
    keyCompression: true,
    version: 0,
    title: 'Debt Payments Schema in RxDB',
    primaryKey: 'debtPaymentId',
    type: 'object',
    properties: {
        debtPaymentId: {
            type: 'string',
            maxLength: 38
        },
        debtId: {
            type: 'string',
            maxLength: 38
        },
        userId: {
            type: 'string',
            maxLength: 38
        },
        amountPaid: {
            type: 'integer',
        },
        paymentDate: {
            type: 'string',
            format: 'date-time'
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
        'debtPaymentId',
        'debtId',
        'userId',
        'amountPaid',
        'paymentDate',
        'createdAt',
        'updatedAt'
    ]
};