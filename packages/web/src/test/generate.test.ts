import { generateBoardsWithMaxGivens } from 'sudoku-core/lib/generate'
import { hasUniqueSolution } from 'sudoku-core/lib/utils/hasUniqueSolution'
import { createTestBoard } from './util'
import { input as knownUniqueInput} from './sudokus/nakedPair'
import { first } from 'sudoku-core/lib/utils/misc'

test('hasUniqueSolution', () => {
    const board = createTestBoard(knownUniqueInput)
    const result = hasUniqueSolution(board)
    expect(result).toBe(true)
})

test('generate', () => {
    const board = first(generateBoardsWithMaxGivens(40))
    let x = 5
})