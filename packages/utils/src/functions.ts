


/**
 * Returns value indicating the platform running the code is a web browser
 * @returns the  platform is web browser
 */
export function isWebPlatform(): boolean {
    return window !== undefined && window.document !== undefined;
}
