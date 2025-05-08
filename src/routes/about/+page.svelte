<script>
    import {getContext, onMount} from "svelte";

    onMount(() => {
        const socket = document.socket;

        const cmd = new Uint16Array([6,2,3]);

        socket.send(cmd);
    })
</script>



WESH ALOTE
<span>helooooo</span>