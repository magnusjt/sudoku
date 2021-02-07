import { Board, SolverBoard, SolveResult, Technique } from './types'
import { allBasicEliminations, basicElimination } from './solvers/basic'
import { fullHouse, hiddenSingle, nakedSingle } from './solvers/singles'
import { inversePointer, pointer } from './solvers/pointer'
import { hiddenPair, hiddenQuad, hiddenTriple, nakedPair, nakedQuad, nakedTriple } from './solvers/subset'
import { jellyfish, swordfish, xWing } from './solvers/fish'
import { uniqueRectangle1 } from './solvers/uniqueRectangle'
import { skyscraper } from './solvers/skyscraper'
import { emptyRectangle } from './solvers/emptyRectangle'
import { wWing, xyWing, xyzWing } from './solvers/wing'
import { isBoardFinished } from './utils/sudokuUtils'
import { unique } from './utils/misc'
import { applyEffects } from './utils/effects'
import { bruteForce } from './solvers/bruteForce'
import { aicType12, remotePairChain, simpleColoring, xChain, xyChain } from './solvers/chains'
import { bugPlus1 } from './solvers/bug'

export const techniques: {type: string, fn: Technique, difficulty: string}[] = [
    {type: 'basic', fn: basicElimination, difficulty: 'beginner'},
    {type: 'fullHouse', fn: fullHouse, difficulty: 'beginner'}, // Easy newspaper style
    {type: 'hiddenSingle', fn: hiddenSingle, difficulty: 'easy'}, // Can be easy or hard tbh, but with highlighting it's often easy
    {type: 'pointer', fn: pointer, difficulty: 'medium'},
    {type: 'inversePointer', fn: inversePointer, difficulty: 'medium'},
    {type: 'nakedSingle', fn: nakedSingle, difficulty: 'medium'}, // Note: Fullhouse is included earlier, so this naked single might actually be very hard to find sometimes
    {type: 'nakedPair', fn: nakedPair, difficulty: 'medium'},
    {type: 'hiddenPair', fn: hiddenPair, difficulty: 'hard'},
    {type: 'xwing', fn: xWing, difficulty: 'hard'}, // When you know about it, easier than triples
    {type: 'nakedTriple', fn: nakedTriple, difficulty: 'hard'},
    {type: 'hiddenTriple', fn: hiddenTriple, difficulty: 'hard'},
    {type: 'nakedQuad', fn: nakedQuad, difficulty: 'hard'}, // At least it's naked, but 4 is a lot :P
    {type: 'uniqueRectangle1', fn: uniqueRectangle1, difficulty: 'expert'}, // Type 1 is quite easy to spot when you know about it. The others, not so much.
    {type: 'bugPlus1', fn: bugPlus1, difficulty: 'expert'}, // BUG+1 is a quick way to finish a puzzle
    {type: 'skyscraper', fn: skyscraper, difficulty: 'expert'}, // A bit harder than x-wing. A bit more chainy
    {type: 'swordfish', fn: swordfish, difficulty: 'expert'}, // Quite hard to spot, but easier with highlighting
    {type: 'emptyRectangle', fn: emptyRectangle, difficulty: 'expert'}, // Not too hard to spot when you know about it. A bit chainy
    {type: 'hiddenQuad', fn: hiddenQuad, difficulty: 'expert'}, // Quite hard to spot imo, but not chainy
    {type: 'remotePairChain', fn: remotePairChain, difficulty: 'artisan'}, // Easy chain to spot if you have all candidates
    {type: 'wwing', fn: wWing, difficulty: 'artisan'}, // More of a pattern than xyWing imo
    {type: 'jellyfish', fn: jellyfish, difficulty: 'artisan'}, // Highlights is a must for jellyfish
    {type: 'xywing', fn: xyWing, difficulty: 'artisan'}, // Chainy. Quite hard to spot
    {type: 'xyzwing', fn: xyzWing, difficulty: 'artisan'}, // Same as xywing, but even more digits, so a bit harder.
    {type: 'simpleColoring', fn: simpleColoring, difficulty: 'master'}, // Quite time consuming, but not actually that hard
    {type: 'xChain', fn: xChain, difficulty: 'master'}, // Let's have a stare shall we?
    {type: 'xyChain', fn: xyChain, difficulty: 'master'}, // Stare even harder...
    {type: 'aicType12', fn: aicType12, difficulty: 'master'}, // Stare even more harder...
    {type: 'bruteForce', fn: bruteForce, difficulty: 'jedi'} // Stare for days
]

export const difficulties = unique(techniques.map(t => t.difficulty))

export const difficultyLevels = {
    beginner: 0,
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 4,
    artisan: 5,
    master: 6,
    jedi: 7
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