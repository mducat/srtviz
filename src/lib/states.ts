import {type Writable, writable} from "svelte/store";
import type {LayerType} from "$lib/objects";

export const project = writable(-1);
export const layer = writable(0);


export const layer_types: Writable<LayerType[]> = writable([]);


