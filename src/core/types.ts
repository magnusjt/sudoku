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
export type SolverBoard = Board // The same as board, but we expect all candidates to be filled in.

export type Effect = EliminationEffect | NoneEffect | ValueEffect | AddCandidatesEffect

export type NoneEffect = {type: 'none'}

export type EliminationEffect = {
    type: 'elimination'
    point: Point
    numbers: number[]
}
export type AddCandidatesEffect = {
    type: 'addCandidates'
    point: Point
    numbers: number[]
}

export type ValueEffect = {
    type: 'value',
    point: Point,
    number: number | null
}

export type Actor = {
    point: Point
}

export type Technique = (board: SolverBoard) => {effects: Effect[], actors: Actor[]} | null

export type SolveResult = {
    board: SolverBoard
    effects: Effect[]
    actors: Actor[]
    technique: string
}

export type InputMode = 'value' | 'candidates' | 'erase'