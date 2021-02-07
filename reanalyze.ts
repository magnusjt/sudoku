import { getBoardMetaData } from './src/core/utils/getBoardMetaData'
import fs from 'fs'
import { arraysEqual } from './src/core/utils/misc'
import { boardFromStr } from './src/core/sudoku'

const lines = fs.readFileSync('./boards/boardsV2.txt', 'utf8').split('\n').filter(line => line.trim() !== '')

const rename = false

for(let line of lines){
    const previousMetaData = JSON.parse(line)
    const board = boardFromStr(previousMetaData.boardData)
    console.time()
    const metaData = getBoardMetaData(board)
    console.timeEnd()

    if(!rename){
        metaData.name = previousMetaData.name
    }

    const sameTechniques = arraysEqual(previousMetaData.techniques, metaData.techniques, (a, b) => a === b)
    const sameDifficulty = previousMetaData.difficulty.difficulty === metaData.difficulty.difficulty

    if(!(sameTechniques && sameDifficulty)){
        console.log('diff')
        console.log(JSON.stringify(previousMetaData))
        console.log(JSON.stringify(metaData))
    }

    fs.appendFileSync('./boards/boards.new.txt', JSON.stringify(metaData) + '\n')
}