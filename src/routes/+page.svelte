<script lang="ts">
    import "../style.css";
    import {p_send} from "$lib/protocol.js";
    import {onMount} from "svelte";
    import {LayerType, NodeType} from "$lib/objects.js";
    import NodesView from "./components/nodes_view.svelte";

    import { toast } from 'svoast';
    import Prompt from "./components/prompt.svelte";

    onMount(() => {

        console.log('mount')
        p_send("/v0/cmd/meta/types")?.then((data) => {
            // result payload:
            // const array = new Uint16Array([0x05 | (0x1 << 2 << 8), (0x1 | 0x2)]);

            let result = {
                layers: data.arrayOf(LayerType),
                nodes_type: data.arrayOf(NodeType, "uint64")
            };

            // console.log(result);
        });

        p_send("/v0/cmd/status")?.then((data) => {
            let vMaj = data.uint8();
            let vMin = data.uint8();
            let vPatch = data.uint8();

            console.log(`Protocol v${vMaj}.${vMin}.${vPatch}`);
        });

    })

    let layers: any[] = $state([]);

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
            let projects = data.arrayOf("uint16");
            toast.info(`Projects: ${projects}`);
        });
    }

    let acceptNewProject: Prompt;
    let accepted: boolean;

</script>

<div style="height: 100%" class="flex">

    {#if layers.length}
        <div class="bg-neutral text-neutral-content w-fit m-2 p-2 rounded-xl">
            <div class="tabs tabs-border bg-neutral rounded-xl">
                {#each layers as layer}
                    <input type="radio" name="my_tabs_2" class="tab border-accent" aria-label="Tab 1" checked="checked" />
                    <div class="tab-content border-base-300 bg-neutral p-10 rounded-xl">
                        <NodesView></NodesView>
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
                <button class="btn btn-primary mx-1" onclick={openProject}>Open project</button>
            </div>
        </div>
    </div>

    <Prompt
            bind:this={acceptNewProject}
            title="Create Project"
            description="Are you sure you want to accept create a new project?"
            label="Create"
            onresult={acceptCreateProject}
    ><div></div></Prompt>

</div>
