// src/utils/id-converter.ts (НОВЫЙ ФАЙЛ)
export const toBackendId = (id: string): number => parseInt(id, 10);
export const toFrontendId = (id: number): string => id.toString();