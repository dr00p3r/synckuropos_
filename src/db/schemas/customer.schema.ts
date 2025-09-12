export const customerSchema = {
    keyCompression: true,
    version: 0,
    title: 'Customers Schema in RxDB',
    primaryKey: 'customerId',
    type: 'object',
    properties: {
        customerId: {
            type: 'string',
            maxLength: 32
        },
        fullname: {
            type: 'string',
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
        'customerId',
        'fullname',
        'isActive',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['fullname']
};
