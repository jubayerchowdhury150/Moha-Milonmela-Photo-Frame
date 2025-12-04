
export interface PhotoState {
  src: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface FrameState {
  src: string | null;
  width?: number;
  height?: number;
}

export enum EditorMode {
  UPLOAD = 'UPLOAD',
  ADJUST = 'ADJUST',
  EXPORT = 'EXPORT'
}
