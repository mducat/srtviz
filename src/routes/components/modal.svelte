<script lang="ts">
    import type { Snippet } from 'svelte'
    import { createDialog } from 'svelte-headlessui'
    import Transition from 'svelte-transition'

    interface Props {
        children: Snippet
        commands: Snippet
        onclose: () => void
    }

    let { children, commands, onclose }: Props = $props()

    const dialog = createDialog()

    export function open() {
        dialog.open()
    }

    export function close() {
        dialog.close()
    }
</script>

<Transition show={$dialog.expanded} unmount>
    <div class="z-10">
        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <div
                            class="relative transform overflow-hidden rounded-lg  text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                            use:dialog.modal
                            {onclose}
                    >
                        <div class="bg-neutral-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">{@render children()}</div>
                        <div class="bg-neutral-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">{@render commands()}</div>
                    </div>
                </Transition>
            </div>
        </div>
    </div>
</Transition>