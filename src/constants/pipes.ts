export enum EmptyPipe {
    '═' = '═',
    '║' = '║',
    '╔' = '╔',
    '╗' = '╗',
    '╚' = '╚',
    '╝' = '╝',
    '╠' = '╠',
    '╣' = '╣',
    '╦' = '╦',
    '╩' = '╩',
    '╬' = '╬',
  }
  
  export enum FilledPipe {
    '━' = '━',
    '┃' = '┃',
    '┏' = '┏',
    '┓' = '┓',
    '┗' = '┗',
    '┛' = '┛',
    '┣' = '┣',
    '┫' = '┫',
    '┳' = '┳',
    '┻' = '┻',
    '╋' = '╋',
  }
  
  export enum EmptyToFilledPipe {
    '═' = '━',
    '║' = '┃',
    '╔' = '┏',
    '╗' = '┓',
    '╚' = '┗',
    '╝' = '┛',
    '╠' = '┣',
    '╣' = '┫',
    '╦' = '┳',
    '╩' = '┻',
    '╬' = '╋',
  }
  
  export enum DirectionPipe {
    '△' = '△',
    '▷' = '▷',
    '▽' = '▽',
    '◁' = '◁',
  }
  
  export const pipes = [...Object.values(EmptyPipe), ...Object.values(FilledPipe)]