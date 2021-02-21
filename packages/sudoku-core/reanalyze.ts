import { getBoardMetaData } from './src/utils/getBoardMetaData'
import fs from 'fs'
import { arraysEqual } from './src/utils/misc'
import { boardFromStr } from './src/sudoku'

const lines = fs.readFileSync('./boards/boards.combined.txt', 'utf8').split('\n').filter(line => line.trim() !== '')

const rename = false

const boards = new Set()

for(const line of lines){
    const previousMetaData = JSON.parse(line)
    const board = boardFromStr(previousMetaData.boardData)
    console.time()
    const metaData = getBoardMetaData(board)
    console.timeEnd()

    if (boards.has(metaData.boardData)) {
        console.log('Duplicate board: ' + metaData.boardData)
    }
    boards.add(metaData.boardData)

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