export type Cell = {
    value: number | null
    candidates: number[]
    given: boolean
}
export type Point = {
    x: number
    y: number
}
export type Board = Cell[][]

export type Effect = EliminationEffect | NoneEffect | ValueEffect

export type NoneEffect = {type: 'none'}

export type EliminationEffect = {
    type: 'elimination'
    point: Point
    numbers: number[]
}

export type ValueEffect = {
    type: 'value',
    point: Point,
    number: number
}

export type Actor = {
    point: Point
}

export type Technique = (board: Board) => {effects: Effect[], actors: Actor[]} | null

export type SolveResult = {
    board: Board
    effects: Effect[]
    actors: Actor[]
    technique: string
}

export type InputMode = 'normal' | 'candidates'