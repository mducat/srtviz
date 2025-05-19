
export const INSTRUCTION_MASK = 0xFF;

export const CREATE  = 0x01;
export const READ    = 0x02;
export const UPDATE  = 0x03;
export const DELETE  = 0x04;
export const COMMAND = 0x05;


export const INSTANCE_MASK = 0xFF;

export const INSTANCE_PROJECT = 0x1 << 0;
export const INSTANCE_LAYER   = 0x1 << 1;
export const INSTANCE_OBJECT  = 0x1 << 2;


export const CMD_MASK    = 0xFF << 8;

export const CMD_STATUS  = 0x1 << 0 << 8;
export const CMD_PROJECT = 0x1 << 1 << 8;
export const CMD_META    = 0x1 << 2 << 8;


export const PROJECT_MASK  = 0xFF;

export const PROJECT_START = 0x1 << 0;
export const PROJECT_STOP  = 0x1 << 1;


export const META_MASK = 0xFF;

export const META_LIST_LAYERS_TYPE = 0x1 << 0;
export const META_LIST_NODES_TYPE  = 0x1 << 1;



export const STATUS_MASK = 0xFF;

export const STATUS_OK              = 0x01;
export const STATUS_INTERNAL_ERROR  = 0x02;
export const STATUS_INTERNAL_PANIC  = 0x03;
