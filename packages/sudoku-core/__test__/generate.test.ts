import { generateBoardsWithMaxGivens } from '../src/generate'
import { hasUniqueSolution } from '../src/utils/hasUniqueSolution'
import { createTestBoard } from './util'
import { input as knownUniqueInput} from './sudokus/nakedPair'
import { first } from '../src/utils/misc'

test('hasUniqueSolution', () => {
    const board = createTestBoard(knownUniqueInput)
    const result = hasUniqueSolution(board)
    expect(result).toBe(true)
})

test('generate', () => {
    const board = first(generateBoardsWithMaxGivens(40))
    let x = 5
})