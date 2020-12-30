import { Board, Technique } from '../types'
import { difference, getAllHouses, getAllPoints, getBoardCell, pointsEqual } from '../utils'

/**
 * There is only one candidate in a given cell
 */
export const nakedSingle: Technique = (board: Board) => {
    for(let point of getAllPoints()){
        const cell = getBoardCell(board, point)
        if(cell.candidates.length === 1){
            return {
                actors: [{point}],
                effects: [{type: 'value', point, number: cell.candidates[0]}]
            }
        }
    }
    return null
}

/**
 * The candidate is only in one position in the box, row, or column, and is hidden among other candidates
 * All naked singles must be eliminated first or else we find them as hidden singles
 */
export const hiddenSingle: Technique = (board: Board) => {
    for(let points of getAllHouses()){
        for(let n = 1; n <= 9; n++){
            const pointsWithN = points.filter(p => getBoardCell(board, p).candidates.some(c => c === n))
            if(pointsWithN.length === 1){
                const point = pointsWithN[0]
                const removedCandidates = getBoardCell(board, point).candidates.filter(c => c !== n)
                if(removedCandidates.length > 0){
                    return {
                        effects: [{type: 'elimination', point, numbers: removedCandidates}],
                        actors: difference(points, [point], pointsEqual).map(point => ({point}))
                    }
                }
            }
        }
    }
    return null
}