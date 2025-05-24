<script lang="ts">
    import type { Snippet } from 'svelte'
    import Modal from './modal.svelte';

    interface Props {
        title: string
        description: string
        label: string
        children: Snippet
        onresult: (result: boolean) => void
    }

    let { title, description, label, children, onresult }: Props = $props()

    let modal: Modal

    export function open() {
        modal.open()
    }

    function close(result: boolean) {
        modal.close()
        onresult(result)
    }
</script>

<Modal bind:this={modal} onclose={() => onresult(false)}>
    <div class="sm:flex  sm:items-start">
        <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 class="text-base font-semibold leading-6 text-white" id="modal-title">{title}</h3>
            <div class="mt-2">
                <p class="text-sm text-white">
                    {description}
                </p>
            </div>
        </div>
    </div>
    {#if children}
        <br/>
        {@render children()}
    {/if}

    {#snippet commands()}
        <button
                type="button"
                class="inline-flex w-full btn-primary justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto"
                onclick={() => close(true)}
        >
            {label}
        </button>

        <button
                type="button"
                class="mt-3 inline-flex w-full justify-center rounded-md text-white px-3 py-2 text-sm font-semibold btn-primary sm:mt-0 sm:w-auto"
                onclick={() => close(false)}
        >
            Cancel
        </button>
    {/snippet}
</Modal>