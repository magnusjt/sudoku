import { generateBoardsWithMaxGivens } from './src/generate'
import { difficultyLevels, techniques } from './src/solve'
import { getBoardMetaData } from './src/utils/getBoardMetaData'
import fs from 'fs'
import { unique } from './src/utils/misc'
import { boardToStr } from './src/sudoku'

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

const minimumDifficulty = difficultyLevels['hard']

for(const board of generateBoardsWithMaxGivens(50, true)){
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

    fs.appendFileSync('./boards/boards8.txt', JSON.stringify(meta) + '\n')
}