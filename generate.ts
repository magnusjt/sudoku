import { generateBoardsWithMaxGivens } from './src/core/generate'
import { techniques } from './src/core/solve'
import { getBoardMetaData } from './src/core/utils/getBoardMetaData'
import fs from 'fs'
import { unique } from './src/core/utils/misc'

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

for(let board of generateBoardsWithMaxGivens(50, true)){
    const meta = getBoardMetaData(board)

    if(countPerDifficulty[meta.difficulty.difficulty] >= 100){
        const hasNeededTechnique = meta.techniques.some(t => {
            return countPerTechnique[t] === 0
        })
        if(!hasNeededTechnique){
            continue
        }
    }
    countPerDifficulty[meta.difficulty.difficulty]++
    meta.techniques.forEach(t => {
        countPerTechnique[t]++
    })

    console.log(countPerTechnique)
    console.log(countPerDifficulty)

    fs.appendFileSync('./boards/boards.txt', JSON.stringify(meta) + '\n')
}