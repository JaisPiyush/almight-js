

export class LocalStorageMock {
    private storage: Record<string, string> = {}


    clear(): void {
        this.storage = {};
    }


    removeItem(key: string): void {
        if(this.storage[key] === undefined) return;
        delete this.storage[key];
    }


    getItem(key: string): string | null{
        if(this.storage[key] === undefined) return null;
        return this.storage[key];
    }

    setItem(key: string, value: string): void {
        this.storage[key] = value;
    }


}