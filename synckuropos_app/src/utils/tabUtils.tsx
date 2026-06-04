export const tabHeaderTemplate = (options: any) => (
    <div className="flex align-items-center gap-2 p-3 cursor-pointer" onClick={options.onClick}>
        <i className={options.leftIcon} />
        <span className="font-bold">{options.title}</span>
    </div>
);
