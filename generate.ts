import { generateBoardsWithMaxGivens } from './src/core/generate'
import { difficultyLevels, techniques } from './src/core/solve'
import { getBoardMetaData } from './src/core/utils/getBoardMetaData'
import fs from 'fs'
import { unique } from './src/core/utils/misc'
import { boardToStr } from './src/core/sudoku'

const countPerDifficulty = unique(techniques.map(t => t.difficulty))
    .reduce((x, d) => {
        x[d] = 0
        return x
    }, {})

const countPerTechnique = techniques.map(t => t.type)
    .reduce((x, t) => {
        x[t] = 0
        return x
    }, {})

const minimumDifficulty = difficultyLevels['easy']

for(let board of generateBoardsWithMaxGivens(50, false, true)){
    let meta
    try {
        meta = getBoardMetaData(board)
    } catch (err) {
        fs.appendFileSync('./boards/errors.txt', err.message + ' ' + boardToStr(board) + '\n')
        continue
    }

    if (meta.difficulty.level < minimumDifficulty) {
        continue
    }

    const hasEnoughOfDifficulty = countPerDifficulty[meta.difficulty.difficulty] >= 100
    const hasEnoughOfTechniques = meta.techniques.every(t => {
        return countPerTechnique[t] >= 100
    })

    if (hasEnoughOfDifficulty && hasEnoughOfTechniques) {
        continue
    }

    countPerDifficulty[meta.difficulty.difficulty]++
    meta.techniques.forEach(t => {
        countPerTechnique[t]++
    })

    console.log(countPerTechnique)
    console.log(countPerDifficulty)

    fs.appendFileSync('./boards/boards0306_2.txt', JSON.stringify(meta) + '\n')
}