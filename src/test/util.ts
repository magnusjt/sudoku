import { boardFromInput } from '../core/sudoku'
import { allBasicEliminations } from '../core/solvers/basic'
import { applyEffects } from '../core/utils'

export const createTestBoard = (input) => {
    const board = boardFromInput(input)
    const result = allBasicEliminations(board)
    if(result) return applyEffects(board, result.effects)
    return board
}