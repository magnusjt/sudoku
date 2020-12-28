export type Field = {
    value: number | null
    candidates: number[]

}
export type Point = {
    x: number
    y: number
}
export type Board = Field[][]

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