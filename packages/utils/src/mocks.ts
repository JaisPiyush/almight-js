import ganache, { ServerOptions, Server } from "ganache"

export class LocalStorageMock {
    private storage: Record<string, string> = {}


    clear(): void {
        this.storage = {};
    }


    removeItem(key: string): void {
        if (this.storage[key] === undefined) return;
        delete this.storage[key];
    }


    getItem(key: string): string | null {
        if (this.storage[key] === undefined) return null;
        return this.storage[key];
    }

    setItem(key: string, value: string): void {
        this.storage[key] = value;
    }
}

export async function startGanache({
    options = {
        logging: {
            quiet: true
        }
    },
    port = 8545
}: {
    options?: ServerOptions<"ethereum">,
    port?: number
}): Promise<Server<"ethereum">> {
    const server = ganache.server(options);
    await server.listen(port);
    return server;
}


export async function closeGanahceServer(server: Server<"ethereum">): Promise<void> {
    await server.close();
}

export {ServerOptions, Server};