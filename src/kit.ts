export const getWujiePropsFn = () => window?.$wujie?.props || {};

export const getTerminalFn = () => getWujiePropsFn()?.terminal || "i18n";
