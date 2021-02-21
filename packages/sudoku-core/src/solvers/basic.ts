import { SolverBoard } from '../types'
import { removeCandidateFromAffectedPoints } from '../utils/effects'
import { allResults, first  } from '../utils/misc'
import { getAllPoints, getBoardCell } from '../utils/sudokuUtils'

/**
 * Just removes candidates from row, col, and box where the candidate is set as a value.
 * I.e. Use only the basic constraints of sudoku.
 */
function *basicEliminationsGenerator(board: SolverBoard){
    for(const point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.value === null){
            continue
        }

        const effects = removeCandidateFromAffectedPoints(board, point, cell.value)
        const actors = [{point}]

        if(effects.length > 0){
            yield {effects, actors}
        }
    }
    return null
}

export const basicElimination = (board: SolverBoard) => first(basicEliminationsGenerator(board))
export const allBasicEliminations = (board: SolverBoard) => allResults(basicEliminationsGenerator(board))