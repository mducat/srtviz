<script lang="ts">
    import "../style.css";
    import {p_send} from "$lib/protocol.js";
    import {onMount} from "svelte";
    import {LayerType, NodeType} from "$lib/objects.js";
    import NodesView from "./components/nodes_view.svelte";

    import { toast } from 'svoast';
    import Prompt from "./components/prompt.svelte";

    import {layer_types, project} from '$lib/states';

    onMount(() => {

        p_send("/v0/cmd/meta/types")?.then((data) => {
            let result = {
                layers: data.arrayOf(LayerType),
                nodes_type: data.arrayOf(NodeType, "uint64")
            };

            layer_types.set(result.layers);
        });

        p_send("/v0/cmd/status")?.then((data) => {
            let vMaj = data.uint8();
            let vMin = data.uint8();
            let vPatch = data.uint8();

            console.log(`Protocol v${vMaj}.${vMin}.${vPatch}`);
        });

        project.subscribe(r => {
            if ($project > 0) {
                readLayers();
            }
        })
    })

    let layers: Object = $state({});

    let projects: number[] = $state([]);

    function acceptCreateProject(accepted: boolean) {
        if (!accepted) {
            toast.success('Cancelled');
            return;
        }

        p_send("/v0/create/project")?.then((data) => {
            let project_id = data.uint16();
            toast.attention(`Project ${project_id} created!`);
        });
    }

    function createProject() {
        acceptNewProject.open();
    }

    function openProject() {
        p_send("/v0/read/project")?.then((data) => {
            projects = data.arrayOf("uint16");
            toast.info(`Projects: ${projects}`);
            console.log(projects);
        });
    }

    let acceptNewProject: Prompt;
    let createNewLayer: Prompt;
    let accepted: boolean;

    let selectProjectPopup: HTMLElement;

    function selectProject(projectId: number) {
        selectProjectPopup.hidePopover();

        project.set(projectId);
        readLayers();
    }

    function createLayerPrompt() {
        createNewLayer.open();
    }

    function readLayers() {

        p_send("/v0/read/layer", (r) => {
            r.wUint16($project);
        })?.then((data) => {
            let all_layers = data.map("uint16", "str");

            toast.info(JSON.stringify(all_layers));

            layers = all_layers;
        });

    }

    let layer_id = $state(-1);

    function selectLayer(newId: number) {
        layer_id = newId;
        console.log('selectLayer', layer_id, (layer_id >= 0));
        currentView.refreshGraph();
    }

    function createDemo() {
        p_send("/v0/create/demo", (r) => {
            r.wUint16($project);
            r.wUint16(layer_id);
        })?.then(() => {
            currentView.refreshGraph();
        });
    }

    function createLayer() {
        let layer_type_id = layerTypeSelect.value;

        p_send("/v0/create/layer", (r) => {
            r.wUint16($project);
            r.wInt8(layer_type_id);
        })?.then((data) => {
            let layer_id = data.uint16();
            toast.info(`Layer: ${layer_id}`);

            readLayers();
        });
    }

    function runThread() {
        p_send("/v0/cmd/start", (r) => {
            r.wUint16($project);
        })?.then(() => {
            toast.attention("Project started!");
        });
    }

    function stopThread() {
        p_send("/v0/cmd/stop", (r) => {
            r.wUint16($project);
        })?.then(() => {
            toast.attention("Project stopped!");
        });
    }

    let layerTypeSelect: HTMLElement;

    let currentView: NodesView;

</script>

<div style="height: 100%" class="flex">

    {#if layers}
        <div class="bg-neutral text-neutral-content w-fit m-2 p-2 rounded-xl">
            <div class="tabs tabs-border bg-neutral rounded-xl">
                {#each Object.entries(layers) as [layer_id, layer_name]}
                    <input onclick={() => selectLayer(Number(layer_id))}
                           type="radio"
                           name="my_tabs_2"
                           class="tab border-accent"
                           aria-label={layer_name}
                           checked="checked" />
                    <div class="tab-content border-base-300 bg-neutral p-10 rounded-xl">
                        <NodesView bind:this={currentView} project_id={$project} layer_id={Number(layer_id)}></NodesView>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
    <div class="card bg-neutral text-neutral-content w-fit shadow-sm m-2">
        <div class="card-body">
            <h2 class="card-title">Tools</h2>
            <div class="flex">
                <button class="btn btn-primary mx-1" onclick={createProject}>Create project</button>
                <button class="btn btn-primary mx-1" popovertarget="popover-1" onclick={openProject}>Open project</button>
                {#if project}
                    <button class="btn btn-primary mx-1" onclick={createLayerPrompt}>Create layer</button>
                {/if}
                {#if layer_id >= 0}
                    <button class="btn btn-primary mx-1" onclick={createDemo}>Create demo</button>
                {/if}
                <br>
                {#if project}
                    <button class="btn btn-primary mx-1" onclick={runThread}>Start sim</button>
                    <button class="btn btn-primary mx-1" onclick={stopThread}>Stop sim</button>
                {/if}
            </div>
            <ul bind:this={selectProjectPopup} class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm"
                popover id="popover-1" style="position-anchor:--anchor-1">
                {#each projects as prj}
                    <!-- hidePopover() -->
                    <li><a onclick={() => selectProject(prj)}>{prj}</a></li>
                {/each}
            </ul>
        </div>
    </div>

    <Prompt
            bind:this={acceptNewProject}
            title="Create Project"
            description="Are you sure you want to accept create a new project?"
            label="Create"
            onresult={acceptCreateProject}
    ><div></div></Prompt>

    <Prompt
            bind:this={createNewLayer}
            title="Create Layer"
            description="What type of layer do you want to create?"
            label="Create"
            onresult={createLayer}
    >
        <select bind:this={layerTypeSelect} class="select">
            <option disabled selected>Select a layer type</option>
            {#each $layer_types as layer}
                <option value={layer.layer_id}>{layer.name}</option>
            {/each}
        </select>
    </Prompt>

</div>
