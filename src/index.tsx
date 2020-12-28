import React from 'react'
import ReactDOM from 'react-dom'
import * as sudoku from './core/sudoku'
import { Actor, Board, Effect, Point } from './core/types'
import { pointsEqual } from './core/utils'

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

function App(props){
    const [board, setBoard] = React.useState(initialBoard)
    const [next, setNext] = React.useState<any>({board, effects: [], actors: [], technique: 'NA'})

    const iterate = () => {
        setBoard(next.board)
        const res = sudoku.iterate(next.board)
        setNext(res)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BoardDisplay board={board} effects={next.effects} actors={next.actors} />
            </div>

            <br />
            <br />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={iterate}>Iterate</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div>
                    Technique: {next.technique}
                    {next.effects.map(effect => {
                        return (
                            <div>
                                {JSON.stringify(effect, null, 2)}
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}

const Candidates = (props) => {
    const height = props.height
    const width = props.width

    const fontSize = height / 4
    const boxSize = height / 3
    const spacing = (boxSize - fontSize)/2

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', fontSize: fontSize, fontFamily: 'monospace', color: '#666' }}>
            {props.candidates.map(number => {
                const top = Math.round(Math.floor((number - 1) / 3) * boxSize + spacing)
                const left = Math.round(Math.floor((number - 1) % 3) * boxSize + spacing)
                return (
                    <div style={{ position: 'absolute', top, left }}>
                        {number}
                    </div>
                )
            })}
        </div>
    )
}

const BoardDisplay = (props: {board: Board, effects: Effect[], actors: Actor[]}) => {
    const board = props.board
    const effectHighlights = props.effects.map(eff => (eff as any).point).filter(x => !!x)
    const actorHighlights = props.actors.map(actor => actor.point)

    return (
        <div>
            {board.map((row, y) => {
                const cells = row.map((cell, x) => {
                    let bg = 'white'
                    if(effectHighlights.some(p => pointsEqual(p, {x, y}))){
                        bg = '#b0c9f6'
                    }
                    if(actorHighlights.some(p => pointsEqual(p, {x, y}))){
                        bg = '#c5f6b0'
                    }

                    let style: any = {
                        backgroundColor: bg,
                        border: '1px #aaa solid',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 60,
                        height: 60
                    }
                    if(x % 3 === 0 && x > 0){
                        style = {...style, borderLeft: '2px #000 solid'}
                    }
                    if(y % 3 === 0 && y > 0){
                        style = {...style, borderTop: '2px #000 solid'}
                    }

                    return (
                        <div style={style}>
                            {cell.value === null
                                ? (
                                    <>
                                        <Candidates candidates={cell.candidates} width={style.width} height={style.height} />
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: Math.floor(style.height/2) }}>{cell.value}</span>
                                    </>
                                )
                            }
                        </div>
                    )
                })
                return (
                    <div style={{display: 'flex'}}>
                        {cells}
                    </div>
                )
            })}
        </div>
    )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
