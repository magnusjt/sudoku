export type Cell = {
    value: number | null
    candidates: number[]
    given: boolean
}
export type Point = {
    id: number
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

export type ValueEffect = SetValueEffect | RemoveValueEffect

export type SetValueEffect = {
    type: 'value',
    point: Point,
    number: number
}
export type RemoveValueEffect = {
    type: 'value',
    point: Point,
    number: null
}

export type GroupEffect = GroupEliminationEffect | GroupSetValueEffect

// The cands are removed from the whole group
export type GroupEliminationEffect = {
    type: 'group-elimination'
    group: Point[]
    groupId: string
    number: number
}
// One of the group must have the value
export type GroupSetValueEffect = {
    type: 'group-value'
    group: Point[],
    groupId: string,
    number: number
}

export type Actor = {
    point: Point
    cand?: number
    chainSet?: 'yes' | 'no'
}

export type TechniqueResult<T extends Effect = Effect> = {effects: T[], actors: Actor[]}
export type Technique = <T extends Effect = Effect>(board: SolverBoard) => TechniqueResult<T> | null
export type TechniqueAll = <T extends Effect = Effect>(board: SolverBoard) => TechniqueResult<T>[]

export type SolveResult = {
    board: SolverBoard
    effects: Effect[]
    actors: Actor[]
    technique: string
}

export type InputMode = 'value' | 'candidates' | 'erase'