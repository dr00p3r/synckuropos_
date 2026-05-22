export const getRowClassName = (data: { _deleted: boolean }) => {
    return data._deleted ? 'surface-100 text-500 font-italic' : '';
};