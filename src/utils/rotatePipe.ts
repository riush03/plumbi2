import { EmptyPipe } from "../constants/pipes.js";

export function rotatePipe(pipeType: EmptyPipe): EmptyPipe {
    switch (pipeType) {
      case EmptyPipe['═']:
        return EmptyPipe['║'];
      case EmptyPipe['║']:
        return EmptyPipe['═'];
      case EmptyPipe['╔']:
        return EmptyPipe['╗'];
      case EmptyPipe['╗']:
        return EmptyPipe['╝'];
      case EmptyPipe['╚']:
        return EmptyPipe['╔'];
      case EmptyPipe['╝']:
        return EmptyPipe['╚'];
      case EmptyPipe['╠']:
        return EmptyPipe['╦'];
      case EmptyPipe['╣']:
        return EmptyPipe['╩'];
      case EmptyPipe['╦']:
        return EmptyPipe['╣'];
      case EmptyPipe['╩']:
        return EmptyPipe['╠'];
      default:
        return pipeType; // For pipes that don't rotate (like '╬')
    }
  }