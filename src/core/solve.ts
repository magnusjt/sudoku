import { Board, SolveResult, Technique } from './types'
import { allBasicEliminations, basicElimination } from './solvers/basic'
import { hiddenSingle, nakedSingle } from './solvers/singles'
import { inversePointer, pointer } from './solvers/pointer'
import { hiddenPair, hiddenQuad, hiddenTriple, nakedPair, nakedQuad, nakedTriple } from './solvers/subset'
import { jellyfish, swordfish, xWing } from './solvers/fish'
import { uniqueRectangle } from './solvers/uniqueRectangle'
import { skyscraper } from './solvers/skyscraper'
import { emptyRectangle } from './solvers/emptyRectangle'
import { xyWing, xyzWing } from './solvers/wing'
import { applyEffects, isBoardFinished } from './utils'

export const techniques: {type: string, fn: Technique}[] = [
    {type: 'basic', fn: basicElimination},
    {type: 'nakedSingle', fn: nakedSingle},
    {type: 'hiddenSingle', fn: hiddenSingle},
    {type: 'pointer', fn: pointer},
    {type: 'inversePointer', fn: inversePointer},
    {type: 'nakedPair', fn: nakedPair},
    {type: 'nakedTriple', fn: nakedTriple},
    {type: 'nakedQuad', fn: nakedQuad},
    {type: 'hiddenPair', fn: hiddenPair},
    {type: 'hiddenTriple', fn: hiddenTriple},
    {type: 'hiddenQuad', fn: hiddenQuad},
    {type: 'xwing', fn: xWing},
    {type: 'uniqueRectangle', fn: uniqueRectangle},
    {type: 'skyscraper', fn: skyscraper},
    {type: 'emptyRectangle', fn: emptyRectangle},
    {type: 'xywing', fn: xyWing},
    {type: 'xyzwing', fn: xyzWing},
    {type: 'swordfish', fn: swordfish},
    {type: 'jellyfish', fn: jellyfish},
]

/**
 * Runs techniques in order until one that works is found
 */
export const runTechnique = (board) => {
    for(let technique of techniques){
        const result = technique.fn(board)
        if(result){
            return {
                ...result,
                technique: technique.type
            }
        }
    }

    return null
}

/**
 * Apply given techniques until the board is solved, or the techniques don't work anymore.
 */
export const applyTechniques = (board: Board, techniqueTypes: string[]): Board => {
    while(true){
        if(isBoardFinished(board)){
            return board
        }
        let moreToGo = false
        for(let techType of techniqueTypes){
            const tech = techniques.find(t => t.type === techType)
            if(!tech) throw new Error('Unknown technique type')
            const res = tech.fn(board)
            if(res){
                board = applyEffects(board, res.effects)
                moreToGo = true
            }
        }
        if(!moreToGo){
            return board
        }
    }
}

export const applyBasicEliminations = (board): Board => {
    const res = allBasicEliminations(board)
    if(res){
        board = applyEffects(board, res.effects)
    }
    return board
}

export const iterate = (board: Board): SolveResult | null => {
    const result = runTechnique(board)
    if(result){
        board = applyEffects(board, result.effects)
        return {board, ...result}
    }

    if(isBoardFinished(board)){
        return {board, effects: [], actors: [], technique: 'done'}
    }

    return null
}