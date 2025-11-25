/**
 * Simple mock utility for test utils that doesn't depend on bun:test
 */
export interface MockFunction<T = any> {
    (...args: any[]): T;
    mockReturnValue: (value: T) => MockFunction<T>;
    mockResolvedValue: (value: T) => MockFunction<T>;
    mockRejectedValue: (error: any) => MockFunction<T>;
    mockImplementation: (fn: (...args: any[]) => T) => MockFunction<T>;
    calls: any[][];
    mock: {
        calls: any[][];
        results: any[];
    };
}
export declare function mock<T = any>(implementation?: (...args: any[]) => T): MockFunction<T>;
//# sourceMappingURL=mockUtils.d.ts.map