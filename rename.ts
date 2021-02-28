import fs from 'fs'
import { generateName } from './src/core/utils/generateName'

const lines = fs.readFileSync('./boards/boardsV6.txt', 'utf8').split('\n').filter(line => line.trim() !== '')

const names = new Set()

for(let line of lines){
    const metaData = JSON.parse(line)

    let name
    while(true){
        name = generateName(metaData.difficulty.difficulty)
        if (names.has(name)) {
            continue
        }
        names.add(name)
        break
    }

    metaData.name = name
    fs.appendFileSync('./boards/boards.new.txt', JSON.stringify(metaData) + '\n')
}