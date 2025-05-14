<script>
    import "../style.css";
    import {p_send} from "$lib/protocol.js";
    import {onMount} from "svelte";
    import {LayerType, NodeType} from "$lib/objects.js";
    import NodesView from "./components/nodes_view.svelte";

    onMount(() => {
        p_send("/v0/cmd/meta/type_layers+type_nodes").then((data) => {
            // result payload:
            // const array = new Uint16Array([0x05 | (0x1 << 2 << 8), (0x1 | 0x2)]);

            let status = data.uint8();
            console.log(`[message] Received data from server: ${data.raw.byteLength}, ${status}`);

            let result = {
                layers: data.arrayOf(LayerType),
                nodes_type: data.arrayOf(NodeType, "uint64")
            };

            console.log(result);
        });
    })

</script>

<div style="height: 100%">
    <NodesView></NodesView>
</div>
