import { generateBoardsWithMaxGivens } from './src/core/generate'
import { difficultyLevels } from './src/core/solve'
import { getBoardMetaData } from './src/core/utils/getBoardMetaData'
import fs from 'fs'

let max = 10
let n = 0

for(let board of generateBoardsWithMaxGivens(40)){
    const meta = getBoardMetaData(board)
    if(meta.difficulty.level >= difficultyLevels.hard){
        fs.appendFileSync('./boards/boards.txt', JSON.stringify(meta) + '\n')
        n++
        console.log(meta)
    }
    if(n >= max){
        break
    }
}