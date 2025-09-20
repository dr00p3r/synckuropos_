export const customerSchema = {
    keyCompression: true,
    version: 0,
    title: 'Customers Schema in RxDB',
    primaryKey: 'customerId',
    type: 'object',
    properties: {
        customerId: {
            type: 'string',
            maxLength: 38
        },
        fullname: {
            type: 'string',
            maxLength: 64
        },
        phone: {
            type: 'string',
            maxLength: 10
        },
        email: {
            type: 'string',
            format: 'email'
        },
        address: {
            type: 'string'
        },
        allowCredit: {
            type: 'boolean',
            default: false
        },
        creditLimit: {
            type: 'integer', // Valor en centavos
            minimum: 0,
            default: 0
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
        },
        _deleted: {
            type: 'boolean',
            default: false
        },
    },
    required: [
        'customerId',
        'fullname',
        'allowCredit',
        'creditLimit',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['fullname']
};
