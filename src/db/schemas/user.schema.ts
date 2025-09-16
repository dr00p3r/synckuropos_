export const userSchema = {
    keyCompression: true,
    version: 0,
    title: 'Users Schema in RxDB',
    primaryKey: 'userId',
    type: 'object',
    properties: {
        userId: {
            type: 'string',
            maxLength: 38
        },
        username: {
            type: 'string',
            maxLength: 50
        },
        passwordHash: {
            type: 'string'
        },
        role: {
            type: 'string',
            maxLength: 20,
            enum: ['admin', 'cajero']
        },
        _deleted: {
            type: 'boolean',
            default: false
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
        'userId',
        'username',
        'passwordHash',
        'role',
        '_deleted',
        'createdAt',
        'updatedAt'
    ],
    indexes: ['username', 'role', '_deleted']
};