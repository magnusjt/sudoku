import { Board, Technique } from '../types'
import { allResults, first, getAllPoints, getBoardCell, removeCandidateFromAffectedPoints } from '../utils'

/**
 * Just removes candidates from row, col, and box where the candidate is set as a value
 */
function *basicEliminationsGenerator(board: Board){
    for(let point of getAllPoints()){
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

export const basicElimination: Technique = (board: Board) => first(basicEliminationsGenerator(board))
export const allBasicEliminations: Technique = (board: Board) => allResults(basicEliminationsGenerator(board))