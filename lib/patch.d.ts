export declare function profilePatchPath(profile: string): string;
export declare function readPluginEnabled(profile: string): Record<string, boolean | undefined>;
export declare function setEntryEnabled(profile: string, id: string, enabled: boolean): void;
/** Update an optional entry, returning false when its bundle does not provide it. */
export declare function setEntryEnabledIfPresent(profile: string, id: string, enabled: boolean): boolean;
