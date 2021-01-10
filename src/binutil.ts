export interface BinaryFound {
    readonly found: true;
    readonly how: 'config' | 'path';
    readonly where: string;
}

export interface BinaryPathfinderProvided {
    readonly found: true;
    readonly how: 'pathfinder';
}

export interface ConfiguredBinaryNotFound {
    readonly found: false;
    readonly how: 'config';
    readonly where: string;
}

export interface UnconfiguredBinaryNotFound {
    readonly found: false;
    readonly how: 'path';
}

export type FindBinaryStatus = BinaryFound | BinaryPathfinderProvided | ConfiguredBinaryNotFound | UnconfiguredBinaryNotFound;
