import * as sudoku from '../core/sudoku'
import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Board, SolveResult } from '../core/types'

/*
const input = [ // Easy
    [0, 3, 1, 0, 0, 0, 0, 0, 6],
    [0, 4, 9, 2, 0, 0, 0, 3, 8],
    [0, 2, 0, 0, 1, 0, 0, 4, 5],
    [7, 5, 0, 0, 0, 6, 0, 0, 0],
    [2, 0, 8, 0, 0, 5, 6, 0, 0],
    [0, 9, 6, 0, 3, 2, 7, 5, 0],
    [0, 6, 2, 0, 7, 0, 0, 0, 4],
    [0, 0, 5, 0, 0, 9, 3, 0, 7],
    [0, 7, 0, 5, 6, 1, 0, 2, 0],
]*/
/*
const input = [ // Hard
    [0, 7, 0, 0, 0, 0, 0, 0, 4],
    [0, 4, 0, 0, 2, 0, 6, 0, 3],
    [8, 0, 1, 0, 4, 0, 0, 0, 7],
    [4, 0, 0, 0, 6, 0, 0, 7, 0],
    [0, 0, 3, 1, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 5, 0, 0],
    [1, 0, 0, 0, 0, 0, 8, 0, 2],
    [0, 0, 0, 2, 0, 8, 0, 0, 0],
    [0, 0, 4, 7, 5, 0, 0, 0, 0],
]
*/

const input = [ // Expert
    [0, 6, 0, 4, 0, 5, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 4, 0, 0],
    [3, 7, 0, 0, 0, 0, 0, 0, 6],
    [0, 3, 1, 6, 0, 0, 0, 0, 0],
    [0, 0, 0, 8, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 1],
    [0, 0, 3, 2, 0, 0, 0, 0, 0],
    [4, 0, 0, 0, 0, 0, 8, 0, 0],
    [0, 1, 8, 0, 0, 6, 7, 5, 0],
]
let initialBoard = sudoku.boardFromInput(input)
initialBoard = sudoku.runBasicEliminations(initialBoard)

export function App(props){
    const [board, setBoard] = React.useState(initialBoard)
    const [next, setNext] = React.useState<SolveResult | null>(null)
    const nextBoard = next?.board ?? board

    const setSolveResult = (solveResult: SolveResult | null, prevBoard: Board) => {
        setBoard(prevBoard)
        setNext(solveResult)
    }
    const onSetDigit = () => {

    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BoardDisplay
                    board={board}
                    solveResult={next}
                    onSetDigit={onSetDigit}
                />
                <Solver
                    board={nextBoard}
                    solveResult={next}
                    onSolveResult={setSolveResult}
                />
            </div>
        </div>
    )
}