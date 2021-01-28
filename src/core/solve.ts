import { Board, SolverBoard, SolveResult, Technique } from './types'
import { allBasicEliminations, basicElimination } from './solvers/basic'
import { fullHouse, hiddenSingle, nakedSingle } from './solvers/singles'
import { inversePointer, pointer } from './solvers/pointer'
import { hiddenPair, hiddenQuad, hiddenTriple, nakedPair, nakedQuad, nakedTriple } from './solvers/subset'
import { jellyfish, swordfish, xWing } from './solvers/fish'
import { uniqueRectangle1 } from './solvers/uniqueRectangle'
import { skyscraper } from './solvers/skyscraper'
import { emptyRectangle } from './solvers/emptyRectangle'
import { xyWing, xyzWing } from './solvers/wing'
import { isBoardFinished } from './utils/sudokuUtils'
import { unique } from './utils/misc'
import { applyEffects } from './utils/effects'
import { bruteForce } from './solvers/bruteForce'
import { remotePairChain, xyChain } from './solvers/chains'

export const techniques: {type: string, fn: Technique, difficulty: string}[] = [
    {type: 'basic', fn: basicElimination, difficulty: 'easy'},
    {type: 'fullHouse', fn: fullHouse, difficulty: 'easy'},
    {type: 'hiddenSingle', fn: hiddenSingle, difficulty: 'easy'},
    {type: 'pointer', fn: pointer, difficulty: 'medium'},
    {type: 'inversePointer', fn: inversePointer, difficulty: 'medium'},
    {type: 'nakedSingle', fn: nakedSingle, difficulty: 'medium'},
    {type: 'nakedPair', fn: nakedPair, difficulty: 'medium'},
    {type: 'nakedTriple', fn: nakedTriple, difficulty: 'hard'},
    {type: 'nakedQuad', fn: nakedQuad, difficulty: 'hard'},
    {type: 'hiddenPair', fn: hiddenPair, difficulty: 'hard'},
    {type: 'hiddenTriple', fn: hiddenTriple, difficulty: 'hard'},
    {type: 'hiddenQuad', fn: hiddenQuad, difficulty: 'hard'},
    {type: 'xwing', fn: xWing, difficulty: 'hard'},
    {type: 'skyscraper', fn: skyscraper, difficulty: 'expert'},
    {type: 'uniqueRectangle1', fn: uniqueRectangle1, difficulty: 'expert'},
    {type: 'emptyRectangle', fn: emptyRectangle, difficulty: 'expert'},
    {type: 'xywing', fn: xyWing, difficulty: 'expert'},
    {type: 'xyzwing', fn: xyzWing, difficulty: 'expert'},
    {type: 'swordfish', fn: swordfish, difficulty: 'expert'},
    {type: 'jellyfish', fn: jellyfish, difficulty: 'master'},
    {type: 'remotePairChain', fn: remotePairChain, difficulty: 'master'},
    {type: 'xyChain', fn: xyChain, difficulty: 'master'},
    {type: 'bruteForce', fn: bruteForce, difficulty: 'yoda'}
]

export const difficultyLevels = {
    easy: 0,
    medium: 1,
    hard: 2,
    expert: 3,
    master: 4,
    yoda: 5
}
export const getDifficultyLevel = (difficulty: string) => difficultyLevels[difficulty]

export const getDifficulty = (techniqueType: string) => {
    const difficulty = techniques.find(t => t.type === techniqueType)!.difficulty
    return {difficulty, level: difficultyLevels[difficulty]}
}
export const getOverallDifficulty = (techniqueTypes: string[]) => {
    const difficulty = [...techniques].reverse().find(t => techniqueTypes.includes(t.type))!.difficulty
    return {difficulty, level: difficultyLevels[difficulty]}
}

export const getSolution = (board: SolverBoard) => {
    return applyTechniques(board, ['bruteForce'])
}

/**
 * Runs techniques in order until one that works is found
 */
export const runTechnique = (board: SolverBoard) => {
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
 * Apply given techniques until the board is solved, or the techniques don't work anymore
 */
export const applyTechniques = (board: SolverBoard, techniqueTypes: string[]): Board => {
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

/**
 * Basic elimination is just using the constraints of sudoku alone
 */
export const applyBasicEliminations = (board: SolverBoard): SolverBoard => {
    const res = allBasicEliminations(board)
    if(res){
        board = applyEffects(board, res.effects)
    }
    return board
}

/**
 * Board needs to be prepared with all candidates before running iterate
 */
export const iterate = (board: SolverBoard): SolveResult | null => {
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

export const getTechniquesRequiredForSolvingBoard = (board: SolverBoard) => {
    const techniques: string[] = []
    while(true){
        const res = iterate(board)
        if(res === null){
            throw new Error('Unsupported technique required')
        }
        if(res.technique === 'done'){
            break
        }
        board = res.board
        techniques.push(res.technique)
    }
    return unique(techniques)
}