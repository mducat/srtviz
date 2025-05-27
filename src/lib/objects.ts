

let dataTypes: any = {};


export function getDataType(type: Object, key: string) {
    return dataTypes[(<any>type)["className"]][key];
}

export function getDataTypes(type: Object) {
    return dataTypes[(<any>type)["className"]];
}


export function typed(type: string) {
    function decorator(target: any, propertyKey: any) {
        target = target.constructor.name;
        if (!dataTypes[target])
            dataTypes[target] = {};
        dataTypes[target][propertyKey] = type;
    }

    return decorator;
}

function dataclass(name: string) {
    return function dataclass<T extends { new (...args: any[]): {} }>(Constructor: T) {
        return class extends Constructor {
            constructor(...args: any[])
            {
                super();
                Object.defineProperty(this, "className", {value: name});
                if (!args.length)
                    return;

                for (const [key, value] of Object.entries(args[0])) {
                    (<any>this)[key] = value;
                }
            }
        };
    }
}


@dataclass("LayerType")
export class LayerType {
    @typed("int8") layer_id: number = 0;
    @typed("str")  name: string = "";
}

@dataclass("NodeType")
export class NodeType {
    @typed("uint32") node_type_id: number = 0;
    @typed("str")    name: string = "";
}

@dataclass("GraphNode")
export class GraphNode {
    @typed("uint32") id: number = 0;
    @typed("str")  name: string = "";
}

@dataclass("GraphLink")
export class GraphLink {
    @typed("uint32") source: number = 0;
    @typed("uint32") target: number = 0;
}
