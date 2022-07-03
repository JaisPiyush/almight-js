import ganache, { ServerOptions, Server } from "ganache"
import * as http from "http"

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

export { ServerOptions, Server };


export enum Methods {
    Get = "get",
    Post = "post",
    Put = "put",
    Patch = "patch",
    Delete = "delete"
}

export type MockResponseTypes = string | number | boolean | object | Error;
export type MockResponseArgs = { status?: number, data: MockResponseTypes }


export class PathMethodHandler {

    methodResponseMap: Record<string, MockResponseArgs> = {}

    forMethod(method: string, data: MockResponseArgs): void {
        this.methodResponseMap[method] = data;
    }


    writeResponse(res: http.ServerResponse, data: MockResponseArgs): void {
        let body = data.data
        if (data.data instanceof Error) {
            body = data.data.message;
            data.status = 500;
        }
        res.writeHead(data.status ?? 200);
        res.end(JSON.stringify(body));
    }

    sendResponse(res: http.ServerResponse, method: string): void {
        if (this.methodResponseMap[method] === undefined) {
            this.writeResponse(res, { status: 404, data: `${method.toLocaleUpperCase()} method not found` });
        }
        
        
        this.writeResponse(res, this.methodResponseMap[method]);
    }

    forGet(data: MockResponseArgs): void {
        this.forMethod(Methods.Get, data);
    }

    forPost(data: MockResponseArgs): void {
        this.forMethod(Methods.Post, data);
    }

    forPut(data: MockResponseArgs): void {
        this.forMethod(Methods.Put, data);
    }
    forPatch(data: MockResponseArgs): void {
        this.forMethod(Methods.Patch, data);
    }
    forDelete(data: MockResponseArgs): void {
        this.forMethod(Methods.Delete, data);
    }


}

export type PathMethodMap = Record<string, PathMethodHandler>;

export class MockServer {

    readonly server: http.Server;

    pathMethodsMap: PathMethodMap = {};
    defaultPathMethodHandler = new PathMethodHandler();


    requestListener(req: http.IncomingMessage, res: http.ServerResponse): void {
        const url = new URL(req.url,`http://${req.headers.host}`);
        const path = url.pathname;
        // console.log(res.req.url,req.method);
        if(this.pathMethodsMap[path] !== undefined){
            this.pathMethodsMap[path].sendResponse(res, req.method.toLocaleLowerCase());
            return;
        }
        this.defaultPathMethodHandler.writeResponse(res, {
            status:404,
            data: `Path not found` 
        })

    }
    forPath(path: string): PathMethodHandler {
        if(this.pathMethodsMap[path] === undefined){
            this.pathMethodsMap[path] = new PathMethodHandler()
        }
        return this.pathMethodsMap[path];
    }

    constructor() {
        this.server = http.createServer((req, res) => {
            this.requestListener(req, res)
        });
    }

    start(port: number): void {
        this.server.listen(port);
    }

    stop():void{
        this.server.close();
    }
}


export function createServer(port: number = 8000) {

}
