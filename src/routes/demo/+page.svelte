<script>
    import {getContext, onMount} from "svelte";

    onMount(() => {
        const socket = document.socket;

        const cmd = new Uint16Array([0xABCD]);

        socket.send(cmd);
    })


</script>



<span>helooooo</span>