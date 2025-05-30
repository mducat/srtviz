<script lang="ts">
    import { onMount } from 'svelte';

    import { scaleLinear, scaleOrdinal } from 'd3-scale';
    import { zoom, zoomIdentity } from 'd3-zoom';
    import { schemeCategory10 } from 'd3-scale-chromatic';
    import { select, selectAll, pointer } from 'd3-selection';
    import { drag } from 'd3-drag';
    import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
    import { p_send } from "$lib/protocol";
    import { GraphLink, GraphNode } from "$lib/objects";

    let d3 = { zoom, zoomIdentity, scaleLinear, scaleOrdinal, schemeCategory10, select, selectAll, pointer, drag,  forceSimulation, forceLink, forceManyBody, forceCenter }



    let graph = {
        "nodes": [
            {"id": "Myriel", "group": 1},
            {"id": "Napoleon", "group": 1},
        ],
        "links": [
            {"source": "Napoleon", "target": "Myriel", "value": 1},
        ]
    };


    let canvas: any;
    let width = 500;
    let height = 600;
    const nodeRadius = 5;

    const padding = { top: 20, right: 40, bottom: 40, left: 25 };

    let links = graph.links.map(d => Object.create(d));
    let nodes = graph.nodes.map(d => Object.create(d));

    type NodesViewProps = {
        project_id: number,
        layer_id: number,
    }

    let { project_id, layer_id }: NodesViewProps = $props();

    const groupColour = d3.scaleOrdinal(d3.schemeCategory10);

    export function refreshGraph() {
        p_send("/v0/read/graph", (r) => {
            r.wUint16(project_id);
            r.wUint16(layer_id);
        })?.then(r => {
            let g_nodes = r.arrayOf(GraphNode);

            let n_size = r.uint32();
            let g_links: GraphLink[] = [];

            for (let i = 0; i < n_size; i++) {
                let currentLinks = r.arrayOf(GraphLink);

                g_links = g_links.concat(currentLinks);
            }

            links = g_links;
            nodes = g_nodes;

            simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2))
                .on("tick", simulationUpdate);

            simulationUpdate();
        });
    }

    let transform = d3.zoomIdentity;
    let simulation: any, context: any;
    onMount(() => {
        context = canvas.getContext('2d');
        resize()

        refreshGraph();

        simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", simulationUpdate);

        // title
        d3.select(context.canvas)
            .on("mousemove", () => {
                const pointer = d3.pointer(context.canvas);
                const d = simulation.find(transform.invertX(pointer[0]), transform.invertY(pointer[1]), nodeRadius);

                if (d)
                    context.canvas.title = d.id;
                else
                    context.canvas.title = '';
            });

        d3.select(canvas)
            .call(d3.drag()
                .container(canvas)
                .subject(dragsubject)
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .call(d3.zoom()
                .scaleExtent([1 / 10, 8])
                .on('zoom', zoomed));
    });

    function simulationUpdate () {
        context.save();
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        links.forEach(d => {
            context.beginPath();
            context.moveTo(d.source.x, d.source.y);
            context.lineTo(d.target.x, d.target.y);
            context.globalAlpha = 0.6;
            context.strokeStyle = "#999";
            context.lineWidth = Math.sqrt(d.value);
            context.stroke();
            context.globalAlpha = 1;
        });

        nodes.forEach((d, i) => {
            context.beginPath();
            context.arc(d.x, d.y, nodeRadius, 0, 2*Math.PI);
            context.strokeStyle = "#fff";
            context.lineWidth = 1.5;
            context.stroke();
            context.fillStyle = groupColour(d.group);
            context.fill();
        });
        context.restore();
    }

    function zoomed(currentEvent: any) {
        transform = currentEvent.transform;
        simulationUpdate();
    }

    // Use the d3-force simulation to locate the node
    function dragsubject(currentEvent: any) {
        const node = simulation.find(transform.invertX(currentEvent.x), transform.invertY(currentEvent.y), nodeRadius);
        if (node) {
            node.x = transform.applyX(node.x);
            node.y = transform.applyY(node.y);
        }
        return node;
    }

    function dragstarted(currentEvent: any) {
        if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
        currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
        currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
    }

    function dragged(currentEvent: any) {
        currentEvent.subject.fx = transform.invertX(currentEvent.x);
        currentEvent.subject.fy = transform.invertY(currentEvent.y);
    }

    function dragended(currentEvent: any) {
        if (!currentEvent.active) simulation.alphaTarget(0);
        currentEvent.subject.fx = null;
        currentEvent.subject.fy = null;
    }

    function resize() {
        ({ width, height } = canvas);
    }

</script>

<svelte:window on:resize='{resize}'/>

<div class='container'>
    <canvas bind:this={canvas} width='{width}' height='{height}'/>
</div>

<style>
    canvas {
        float: left;
    }
</style>