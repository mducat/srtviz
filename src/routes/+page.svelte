<script>
    import "../style.css";
    import Test from "./Test.svelte"
    import {p_send} from "$lib/protocol.js";
    import {onMount} from "svelte";

    onMount(() => {
        p_send("/v0/cmd/meta/type_layers+type_nodes").then((data) => {
            // result payload:
            // const array = new Uint16Array([0x05 | (0x1 << 2 << 8), (0x1 | 0x2)]);

            let status = data.uint8();
            console.log(`[message] Received data from server: ${data.raw.byteLength}, ${status}`);

            let result = {
                layers: data.arrayOf(["int8", "str"]),
                nodes_type: data.arrayOf(["uint32", "str"], "uint64")
            };

            console.log(result);
        });
    })

</script>


<div class="drawer">
    <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <!-- Navbar -->
        <div class="navbar bg-base-300 w-full">
            <div class="flex-none lg:hidden">
                <label for="my-drawer-3" aria-label="open sidebar" class="btn btn-square btn-ghost">
                    <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            class="inline-block h-6 w-6 stroke-current"
                    >
                        <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"
                        ></path>
                    </svg>
                </label>
            </div>
            <div class="mx-2 flex-1 px-2">Navbar Title</div>
            <div class="hidden flex-none lg:block">
                <ul class="menu menu-horizontal">
                    <!-- Navbar menu content here -->
                    <li><a>Navbar Item 1</a></li>
                    <li><a>Navbar Item 2</a></li>
                </ul>
            </div>
        </div>
        <!-- Page content here -->
        <Test/>
    </div>
    <div class="drawer-side">
        <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
            <!-- Sidebar content here -->
            <li><a>Sidebar Item 1</a></li>
            <li><a>Sidebar Item 2</a></li>
        </ul>
    </div>
</div>