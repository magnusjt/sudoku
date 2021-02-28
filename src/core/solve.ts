import { Board, SolverBoard, SolveResult } from './types'
import { allBasicEliminations, basicElimination } from './solvers/basic'
import { fullHouse, hiddenSingle, nakedSingle } from './solvers/singles'
import { inversePointer, pointer } from './solvers/pointer'
import { hiddenPair, hiddenQuad, hiddenTriple, nakedPair, nakedQuad, nakedTriple } from './solvers/subset'
import {
    jellyfish, jellyfishFinned, jellyfishFinnedSashimi,
    swordfish,
    swordfishFinned,
    swordfishFinnedSashimi,
    xWing,
    xWingFinned,
    xWingFinnedSashimi
} from './solvers/fish'
import { hiddenRectangle, uniqueRectangle1 } from './solvers/uniqueRectangle'
import { skyscraper } from './solvers/skyscraper'
import { emptyRectangle } from './solvers/emptyRectangle'
import { wWing, xyWing, xyzWing } from './solvers/wing'
import { boardHasError, isBoardFinished, mergeResults } from './utils/sudokuUtils'
import { unique } from './utils/misc'
import { applyEffects } from './utils/effects'
import { bruteForce } from './solvers/bruteForce'
import {
    aicType1,
    aicType1Grouped,
    aicType2,
    aicType2Grouped,
    continuousNiceLoop,
    continuousNiceLoopGrouped, createFindChain,
    discontinuousNiceLoop,
    discontinuousNiceLoopGrouped,
    remotePairChain,
    xChain,
    xyChain
} from './solvers/chains'
import { bugPlus1 } from './solvers/bug'
import { simpleColoring } from './solvers/simpleColoring'

export const techniques = [
    {type: 'basic', difficulty: 'easy'},
    {type: 'fullHouse', difficulty: 'easy'}, // Easy newspaper style
    {type: 'hiddenSingle', difficulty: 'easy'}, // Can be easy or hard tbh, but with highlighting it's often easy
    {type: 'pointer', difficulty: 'medium'},
    {type: 'inversePointer', difficulty: 'medium'},
    {type: 'nakedSingle', difficulty: 'medium'}, // Note: Fullhouse is included earlier, so this naked single might actually be very hard to find sometimes
    {type: 'nakedPair', difficulty: 'medium'},
    {type: 'hiddenPair', difficulty: 'hard'},
    {type: 'xWing', difficulty: 'hard'}, // When you know about it, easier than triples
    {type: 'nakedTriple', difficulty: 'hard'},
    {type: 'hiddenTriple', difficulty: 'hard'},
    {type: 'nakedQuad', difficulty: 'hard'}, // At least it's naked, but 4 is a lot :P
    {type: 'uniqueRectangle1', difficulty: 'expert'}, // Type 1 is quite easy to spot when you know about it. The others, not so much.
    {type: 'bugPlus1', difficulty: 'expert'}, // BUG+1 is a quick way to finish a puzzle
    {type: 'skyscraper', difficulty: 'expert'}, // A bit harder than x-wing. A bit more chainy
    {type: 'swordfish', difficulty: 'expert'}, // Quite hard to spot, but easier with highlighting
    {type: 'emptyRectangle', difficulty: 'expert'}, // Not too hard to spot when you know about it. A bit chainy
    {type: 'hiddenQuad', difficulty: 'expert'}, // Quite hard to spot imo, but not chainy
    {type: 'xWingFinned', difficulty: 'expert'},
    {type: 'xWingFinnedSashimi', difficulty: 'expert'},
    {type: 'remotePairChain', difficulty: 'artisan'}, // Easy chain to spot if you have all candidates
    {type: 'wWing', difficulty: 'artisan'}, // More of a pattern than xyWing imo
    {type: 'hiddenRectangle', difficulty: 'artisan'}, // Much harder than unique rect type 1
    {type: 'jellyfish', difficulty: 'artisan'}, // Highlights is a must for jellyfish
    {type: 'xyWing', difficulty: 'artisan'}, // Chainy. Quite hard to spot
    {type: 'xyzWing', difficulty: 'artisan'}, // Same as xywing, but even more digits, so a bit harder.
    {type: 'swordfishFinned', difficulty: 'artisan'},
    {type: 'swordfishFinnedSashimi', difficulty: 'artisan'},
    {type: 'simpleColoring', difficulty: 'master'}, // Quite time consuming, but not actually that hard
    {type: 'xChain', difficulty: 'master'}, // Let's have a stare shall we?
    {type: 'xyChain', difficulty: 'master'}, // Stare even harder...
    {type: 'jellyfishFinned', difficulty: 'jedi'},
    {type: 'jellyfishFinnedSashimi', difficulty: 'jedi'},
    {type: 'discontinuousNiceLoop', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'aicType1', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'aicType2', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'continuousNiceLoop', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'discontinuousNiceLoopGrouped', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'aicType1Grouped', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'aicType2Grouped', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'continuousNiceLoopGrouped', difficulty: 'jedi'}, // Stare even more harder...
    {type: 'bruteForce', difficulty: 'jedi'} // Stare for days
]

const createTechniqueRunners = (board: SolverBoard) => {
    const findChain = createFindChain(board)
    return {
        basic: basicElimination,
        fullHouse,
        hiddenSingle,
        pointer,
        inversePointer,
        nakedSingle,
        nakedPair,
        hiddenPair,
        xWing,
        nakedTriple,
        hiddenTriple,
        nakedQuad,
        uniqueRectangle1,
        bugPlus1,
        skyscraper,
        swordfish,
        emptyRectangle,
        hiddenQuad,
        xWingFinned,
        xWingFinnedSashimi,
        remotePairChain,
        hiddenRectangle,
        wWing,
        jellyfish: jellyfish,
        xyWing,
        xyzWing,
        swordfishFinned,
        swordfishFinnedSashimi,
        simpleColoring,
        xChain,
        xyChain,
        jellyfishFinned,
        jellyfishFinnedSashimi,
        discontinuousNiceLoop: discontinuousNiceLoop(findChain),
        aicType1: aicType1(findChain),
        aicType2: aicType2(findChain),
        continuousNiceLoop: continuousNiceLoop(findChain),
        discontinuousNiceLoopGrouped: discontinuousNiceLoopGrouped(findChain),
        aicType1Grouped: aicType1Grouped(findChain),
        aicType2Grouped: aicType2Grouped(findChain),
        continuousNiceLoopGrouped: continuousNiceLoopGrouped(findChain),
        bruteForce: bruteForce,
    }
}

export const difficulties = unique(techniques.map(t => t.difficulty))

export const difficultyLevels = {
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
    const techniqueRunners = createTechniqueRunners(board)
    for(let technique of techniques){
        const result = techniqueRunners[technique.type](board)
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
            const techniqueRunners = createTechniqueRunners(board)
            const tech = techniques.find(t => t.type === techType)
            if(!tech) throw new Error('Unknown technique type')
            const res = techniqueRunners[tech.type](board)
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
    const result = mergeResults(allBasicEliminations(board))
    return applyEffects(board, result.effects)
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
    const solution = getSolution(board)

    const techniques: string[] = []
    while(true){
        const res = iterate(board)
        if(res === null){
            throw new Error('Unsupported technique required')
        }
        if(boardHasError(board, solution)){
            throw new Error('Board has error ' + techniques.join(', '))
        }
        if(res.technique === 'done'){
            break
        }
        board = res.board
        techniques.push(res.technique)
    }
    return unique(techniques)
}