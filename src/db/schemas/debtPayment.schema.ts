export const debtPaymentSchema = {
    keyCompression: true,
    version: 0,
    title: 'Debt Payments Schema in RxDB',
    primaryKey: 'debtPaymentId',
    type: 'object',
    properties: {
        debtPaymentId: {
            type: 'string',
            maxLength: 32
        },
        debtId: {
            type: 'string',
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
        'amountPaid',
        'paymentDate',
        'createdAt',
        'updatedAt'
    ]
};