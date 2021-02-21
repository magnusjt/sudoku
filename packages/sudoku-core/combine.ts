import fs from 'fs'
import { randomOrder, unique } from './src/utils/misc'
import { techniques } from './src/solve'
const lines = [
    'boards.txt',
    'boards2.txt',
    'boards3.txt',
    'boards4.txt',
    'boards5.txt',
    'boards6.txt',
    'boards7.txt',
    'boards8.txt',
    'boardsAllNight.txt',
    'boardsNightEvening.txt',
    'boardsV4.txt'
].flatMap(file =>
    fs.readFileSync('./boards/' + file, 'utf8')
        .split('\n').filter(line => line.trim() !== '')
)

const perTechniqueTarget = 20
const perDifficultyTarget = 100

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

for(const line of randomOrder(lines)){
    const meta = JSON.parse(line)

    const hasEnoughOfDifficulty = countPerDifficulty[meta.difficulty.difficulty] >= perDifficultyTarget
    const hasEnoughOfTechniques = meta.techniques.every(t => {
        return (countPerTechnique[t] ?? 0) >= perTechniqueTarget
    })
    if (hasEnoughOfTechniques && hasEnoughOfDifficulty) {
        continue
    }

    countPerDifficulty[meta.difficulty.difficulty]++
    meta.techniques.forEach(t => {
        countPerTechnique[t]++
    })

    fs.appendFileSync('./boards/boards.combined.txt', JSON.stringify(meta) + '\n')
}

console.log(countPerTechnique)
console.log(countPerDifficulty)