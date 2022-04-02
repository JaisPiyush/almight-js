import  {add} from "@almight-sdk/core/meta";


export function args(n: number): number {
    return add(n, n*2);
}